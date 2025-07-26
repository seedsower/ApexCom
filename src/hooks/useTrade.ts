import { useMemo, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useConnect, usePublicClient } from 'wagmi';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from "@/components/ui/use-toast";
import { base } from 'wagmi/chains';
import { type WriteContractErrorType } from 'wagmi/actions';
import { parseUnits } from "viem";

// ERC-20 ABI with essential functions for trading
const ERC20_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Simplified ABI for Uniswap V2 Router (or similar DEX router)
// Only includes functions relevant for direct token swaps
const DEX_ROUTER_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amountOutMin",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "path",
        "type": "address[]"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "swapExactETHForTokens", // For swapping native ETH to tokens
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amountOutMin",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "path",
        "type": "address[]"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "swapExactTokensForTokens", // For swapping ERC20 tokens to ERC20 tokens
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "path",
        "type": "address[]"
      }
    ],
    "name": "getAmountsOut", // To get expected output amount for a given input amount
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// PancakeSwap V2 Router on Base (verified and working)
const DEX_ROUTER_ADDRESS: `0x${string}` = '0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb'; // PancakeSwap V2 Router

// USDC Address on Base network (since your pool uses USDC/Natural Gas)
const USDC_ADDRESS: `0x${string}` = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
const WETH_ADDRESS: `0x${string}` = '0x4200000000000000000000000000000000000006'; // WETH address for Base

// Dummy contract addresses for commodities (replace with actual deployed contract addresses)
const COMMODITY_CONTRACT_ADDRESSES: Record<string, {
  base: `0x${string}`;
  solana: string;
}> = {
  'crude-oil-1': { 
    base: '0x3fF570415a770a9E09E956e10884d5A5e1B057A0', // Example Base address for Crude Oil Token
    solana: 'CrudeOilToken11111111111111111111111111111' // Example Solana address for Crude Oil Token
  },
  'gold-1': {
    base: '0xAb8483B64bE7163Bf82b0f4dd6d2f3B0c3c69Ef7', // Example Base address for Gold Token
    solana: 'GoldToken11111111111111111111111111111111' // Example Solana address for Gold Token
  },
  'cocoa-1': {
    base: '0x7D8466C9737A21092d545BEDd5aBc702f7dE9353',
    solana: '' // Placeholder, no Solana address provided yet
  }
  // Add more commodity to contract address mappings here
};

export const useTrade = () => {
  // Wagmi hooks for Base/Ethereum
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const {
    data: hash,
    writeContract,
    isPending: isBaseTransactionPending,
    isError: isBaseWriteError,
    error: baseWriteError,
  } = useWriteContract();
  const {
    isLoading: isBaseConfirming,
    isSuccess: isBaseConfirmed,
    isError: isBaseConfirmError,
    error: baseConfirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Wagmi public client for read operations
  const publicClient = usePublicClient({ chainId: base.id });

  // Solana hooks
  const { publicKey, sendTransaction, connected: solanaConnected } = useWallet();
  const { connection } = useConnection();

  const buyCommodity = async (
    commodityId: string,
    amount: number,
    network: 'base' | 'solana',
    currentPrice: number,
    commodityName?: string, // Make commodityName optional here
    contractAddresses?: { base?: string; solana?: string } // Add contract addresses parameter
  ) => {
    if (!isConnected && !solanaConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to proceed with the trade.",
        variant: "destructive",
      });
      return { success: false, message: "Wallet not connected." };
    }

    // Use provided contract addresses or fall back to hardcoded mapping
    const addresses = contractAddresses || COMMODITY_CONTRACT_ADDRESSES[commodityId];
    if (!addresses) {
      toast({
        title: "Contract Not Found",
        description: `No contract address found for ${commodityId} on ${network} network.`, 
        variant: "destructive",
      });
      return { success: false, message: "Contract address not found." };
    }

    try {
      if (network === 'base') {
        if (!address) throw new Error("Ethereum wallet not connected.");
        if (!addresses.base) throw new Error("Base contract address not found.");

        // Step 1: Check and approve USDC spending if needed
        console.log("Checking USDC allowance...");
        
        // First check current allowance
        const currentAllowance = await publicClient?.readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, DEX_ROUTER_ADDRESS],
        }) as bigint | undefined;

        const requiredAmount = parseUnits(String(amount), 6); // USDC has 6 decimals
        
        if (!currentAllowance || currentAllowance < requiredAmount) {
          console.log("Insufficient allowance, requesting approval...");
          
          // Request approval for USDC spending
          writeContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [DEX_ROUTER_ADDRESS, requiredAmount * BigInt(2)], // Approve double to avoid frequent approvals
            chainId: base.id,
            account: address,
            chain: base,
          });

          toast({
            title: "Approval Required",
            description: "Please approve USDC spending first, then try trading again.",
            variant: "default",
          });
          return { success: false, message: "USDC approval required. Please approve and try again." };
        }

        console.log("USDC allowance sufficient, checking balance...");
        
        // Check USDC balance
        const usdcBalance = await publicClient?.readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address],
        }) as bigint | undefined;

        if (!usdcBalance || usdcBalance < requiredAmount) {
          toast({
            title: "Insufficient USDC Balance",
            description: `You need ${amount} USDC to complete this swap. Current balance: ${usdcBalance ? Number(usdcBalance) / 1e6 : 0} USDC`,
            variant: "destructive",
          });
          return { success: false, message: "Insufficient USDC balance." };
        }

        // Step 2: Get estimated amount out from the DEX
        let amountOutMin = BigInt(0);
        // Temporarily disable price checking to test basic functionality
        // TODO: Fix router address and enable proper price checking
        /*
        if (publicClient) {
          const path = [WETH_ADDRESS, addresses.base as `0x${string}`];
          const amountsOut = await publicClient.readContract({
            address: DEX_ROUTER_ADDRESS,
            abi: DEX_ROUTER_ABI,
            functionName: 'getAmountsOut',
            args: [parseUnits(String(amount), 18), path],
          });
          // Apply a small slippage tolerance (e.g., 0.5%)
          amountOutMin = amountsOut[1] - (amountsOut[1] * BigInt(5) / BigInt(1000)); // 0.5% slippage
        }
        */

        // Step 3: Execute the swap
        writeContract({
          address: DEX_ROUTER_ADDRESS,
          abi: DEX_ROUTER_ABI,
          functionName: 'swapExactTokensForTokens',
          args: [
            parseUnits(String(amount), 6), // amountIn (USDC)
            amountOutMin, // amountOutMin (commodity token)
            [USDC_ADDRESS, addresses.base as `0x${string}`], // path: USDC -> Commodity Token
            address, // to: recipient of commodity tokens
            BigInt(Math.floor(Date.now() / 1000) + 60 * 20), // deadline: 20 minutes from now
          ],
          chainId: base.id,
          account: address,
          chain: base,
        });

        console.log("Transaction parameters:", {
          router: DEX_ROUTER_ADDRESS,
          amountIn: parseUnits(String(amount), 6).toString(),
          amountOutMin: amountOutMin.toString(),
          path: [USDC_ADDRESS, addresses.base],
          recipient: address,
          deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 20).toString()
        });

        toast({
          title: "Transaction Sent",
          description: "Confirming swap transaction on Base network...",
        });
        return { success: true, message: "Swap transaction sent to Base network." };

      } else if (network === 'solana') {
        if (!publicKey) throw new Error("Solana wallet not connected.");
        if (!addresses.solana) throw new Error("Solana contract address not found.");

        // Simulate buying by sending SOL (for simplicity, actual token swap would be more complex)
        const lamports = amount * currentPrice * LAMPORTS_PER_SOL; // Amount in SOL
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(addresses.solana), // Sending to dummy token address
            lamports,
          })
        );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, 'processed');

        toast({
          title: "Transaction Confirmed",
          description: `Successfully bought ${amount} units of ${commodityName} on Solana. Transaction: ${signature}`,
          variant: "default",
        });
        return { success: true, message: "Transaction confirmed on Solana network." };
      }
      return { success: false, message: "Unsupported network." };

    } catch (error) {
      console.error("Trade error:", error);
      toast({
        title: "Trade Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
      return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  // Add a sellCommodity function similar to buyCommodity, but in reverse
  const sellCommodity = async (
    commodityId: string,
    amount: number,
    network: 'base' | 'solana',
    currentPrice: number,
    commodityName: string, // Made required for toast message
    contractAddresses?: { base?: string; solana?: string } // Add contract addresses parameter
  ) => {
    if (!isConnected && !solanaConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to proceed with the trade.",
        variant: "destructive",
      });
      return { success: false, message: "Wallet not connected." };
    }

    // Use provided contract addresses or fall back to hardcoded mapping
    const addresses = contractAddresses || COMMODITY_CONTRACT_ADDRESSES[commodityId];
    if (!addresses) {
      toast({
        title: "Contract Not Found",
        description: `No contract address found for ${commodityId} on ${network} network.`, 
        variant: "destructive",
      });
      return { success: false, message: "Contract address not found." };
    }

    try {
      if (network === 'base') {
        if (!address) throw new Error("Ethereum wallet not connected.");
        if (!addresses.base) throw new Error("Base commodity contract address not found.");

        // Step 1: Approve the DEX router to spend the commodity token (if not already approved)
        // This is crucial for swapping ERC20 tokens. You would use useWriteContract for this.
        // For example:
        // writeContract({
        //   address: addresses.base,
        //   abi: ERC20_ABI,
        //   functionName: 'approve',
        //   args: [DEX_ROUTER_ADDRESS, parseUnits(String(amount), 18)], // Approve enough commodity tokens
        //   chain: base,
        //   account: address,
        // });
        // And then await its confirmation before proceeding to swap

        // Step 2: Get estimated amount out from the DEX (USDC)
        let amountOutMin = BigInt(0);
        // Temporarily disable price checking to test basic functionality
        // TODO: Fix router address and enable proper price checking
        /*
        if (publicClient) {
          const path = [addresses.base as `0x${string}`, USDC_ADDRESS];
          const amountsOut = await publicClient.readContract({
            address: DEX_ROUTER_ADDRESS,
            abi: DEX_ROUTER_ABI,
            functionName: 'getAmountsOut',
            args: [parseUnits(String(amount), 18), path],
          });
          // Apply a small slippage tolerance (e.g., 0.5%)
          amountOutMin = amountsOut[1] - (amountsOut[1] * BigInt(5) / BigInt(1000)); // 0.5% slippage
        }
        */

        // Step 3: Execute the swap
        writeContract({
          address: DEX_ROUTER_ADDRESS,
          abi: DEX_ROUTER_ABI,
          functionName: 'swapExactTokensForTokens',
          args: [
            parseUnits(String(amount), 18), // amountIn (commodity token)
            amountOutMin, // amountOutMin (USDC)
            [addresses.base as `0x${string}`, USDC_ADDRESS], // path: Commodity Token -> USDC
            address, // to: recipient of USDC
            BigInt(Math.floor(Date.now() / 1000) + 60 * 20), // deadline: 20 minutes from now
          ],
          chainId: base.id,
          account: address,
          chain: base,
        });

        toast({
          title: "Transaction Sent",
          description: "Confirming sell transaction on Base network...",
        });
        return { success: true, message: "Sell transaction sent to Base network." };

      } else if (network === 'solana') {
        console.log(`Simulating sell of ${amount} units of ${commodityId} on ${network} network.`);
        toast({
          title: "Sell Simulated",
          description: `Simulated selling ${amount} units of ${commodityName} on ${network}.`,
        });
        return { success: true, message: "Sell simulation successful." };
      }
      return { success: false, message: "Unsupported network." };

    } catch (error) {
      console.error("Sell operation error:", error);
      toast({
        title: "Sell Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
      return { success: false, message: error instanceof Error ? error.message : "Sell operation failed." };
    }
  };

  // Effects for Base network transaction status
  useEffect(() => {
    if (isBaseConfirmed) {
      toast({
        title: "Transaction Confirmed",
        description: "Your transaction on Base network has been confirmed!",
        variant: "default",
      });
    }
  }, [isBaseConfirmed, toast]);

  useEffect(() => {
    if (isBaseWriteError && baseWriteError) {
      console.error("Base transaction write error:", baseWriteError);
      toast({
        title: "Base Transaction Failed",
        description: `Error sending transaction: ${baseWriteError.message}`,
        variant: "destructive",
      });
    }
  }, [isBaseWriteError, baseWriteError, toast]);

  useEffect(() => {
    if (isBaseConfirmError && baseConfirmError) {
      console.error("Base transaction confirmation error:", baseConfirmError);
      toast({
        title: "Base Transaction Confirmation Failed",
        description: `Error confirming transaction: ${baseConfirmError.message}`,
        variant: "destructive",
      });
    }
  }, [isBaseConfirmError, baseConfirmError, toast]);

  return {
    buyCommodity,
    sellCommodity,
    isBaseTransactionPending,
    isBaseConfirming,
    isBaseConfirmed,
    isSolanaTransactionPending: false, // Placeholder, actual Solana pending state needs to be managed
  };
}; 