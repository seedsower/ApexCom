import { useMemo } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useConnect, usePublicClient } from 'wagmi';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from "@/components/ui/use-toast";
import { base } from 'wagmi/chains';
import { type WriteContractErrorType } from 'wagmi/actions';
import { parseUnits } from "viem";

// Placeholder ERC-20 ABI for a simple token with a transfer function
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

// Placeholder DEX Router Address (replace with actual Uniswap V2/V3 or Aerodrome Router address on Base)
const DEX_ROUTER_ADDRESS: `0x${string}` = '0x4752ba5DBc232B0abC6DdB3fC5376AaeA477d4CA'; // Example Router address (Uniswap V2 Router 02 on Mainnet, usually similar on Base)

// Placeholder WETH Address on Base (replace with actual WETH address on Base)
const WETH_ADDRESS: `0x${string}` = '0x4200000000000000000000000000000000000006'; // Example WETH address for Base

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
    commodityName?: string // Make commodityName optional here
  ) => {
    if (!isConnected && !solanaConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to proceed with the trade.",
        variant: "destructive",
      });
      return { success: false, message: "Wallet not connected." };
    }

    const contractAddresses = COMMODITY_CONTRACT_ADDRESSES[commodityId];
    if (!contractAddresses) {
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
        if (!contractAddresses.base) throw new Error("Base contract address not found.");

        // Step 1: Approve the DEX router to spend WETH (if not already approved)
        // For simplicity, this approval step is omitted in this example, but is crucial
        // You would typically use useWriteContract for approving WETH to the DEX_ROUTER_ADDRESS
        // For example: 
        // writeContract({
        //   address: WETH_ADDRESS,
        //   abi: ERC20_ABI,
        //   functionName: 'approve',
        //   args: [DEX_ROUTER_ADDRESS, parseUnits(String(amount), 18)], // Approve enough WETH
        //   chain: base,
        //   account: address,
        // });
        // And then await its confirmation before proceeding to swap

        // Step 2: Get estimated amount out from the DEX
        let amountOutMin = BigInt(0);
        if (publicClient) {
          const path = [WETH_ADDRESS, contractAddresses.base];
          const amountsOut = await publicClient.readContract({
            address: DEX_ROUTER_ADDRESS,
            abi: DEX_ROUTER_ABI,
            functionName: 'getAmountsOut',
            args: [parseUnits(String(amount), 18), path],
          });
          // Apply a small slippage tolerance (e.g., 0.5%)
          amountOutMin = amountsOut[1] - (amountsOut[1] * BigInt(5) / BigInt(1000)); // 0.5% slippage
        }

        // Step 3: Execute the swap
        writeContract({
          address: DEX_ROUTER_ADDRESS,
          abi: DEX_ROUTER_ABI,
          functionName: 'swapExactTokensForTokens',
          args: [
            parseUnits(String(amount), 18), // amountIn (WETH)
            amountOutMin, // amountOutMin (commodity token)
            [WETH_ADDRESS, contractAddresses.base], // path: WETH -> Commodity Token
            address, // to: recipient of commodity tokens
            BigInt(Math.floor(Date.now() / 1000) + 60 * 20), // deadline: 20 minutes from now
          ],
          chainId: base.id,
          account: address,
          chain: base,
        });

        toast({
          title: "Transaction Sent",
          description: "Confirming swap transaction on Base network...",
        });
        return { success: true, message: "Swap transaction sent to Base network." };

      } else if (network === 'solana') {
        if (!publicKey) throw new Error("Solana wallet not connected.");
        if (!contractAddresses.solana) throw new Error("Solana contract address not found.");

        // Simulate buying by sending SOL (for simplicity, actual token swap would be more complex)
        const lamports = amount * currentPrice * LAMPORTS_PER_SOL; // Amount in SOL
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(contractAddresses.solana), // Sending to dummy token address
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

    } catch (error: any) {
      console.error("Trade operation error:", error);
      toast({
        title: "Trade Failed",
        description: `Error: ${error.message || 'An unexpected error occurred.'}`, 
        variant: "destructive",
      });
      return { success: false, message: error.message || "Trade operation failed." };
    }
  };

  // Add a sellCommodity function similar to buyCommodity, but in reverse
  const sellCommodity = async (
    commodityId: string,
    amount: number,
    network: 'base' | 'solana',
    currentPrice: number,
    commodityName: string // Made required for toast message
  ) => {
    if (!isConnected && !solanaConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to proceed with the trade.",
        variant: "destructive",
      });
      return { success: false, message: "Wallet not connected." };
    }

    const contractAddresses = COMMODITY_CONTRACT_ADDRESSES[commodityId];
    if (!contractAddresses) {
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
        if (!contractAddresses.base) throw new Error("Base commodity contract address not found.");

        // Step 1: Approve the DEX router to spend the commodity token (if not already approved)
        // This is crucial for swapping ERC20 tokens. You would use useWriteContract for this.
        // For example:
        // writeContract({
        //   address: contractAddresses.base,
        //   abi: ERC20_ABI,
        //   functionName: 'approve',
        //   args: [DEX_ROUTER_ADDRESS, parseUnits(String(amount), 18)], // Approve enough commodity tokens
        //   chain: base,
        //   account: address,
        // });
        // And then await its confirmation before proceeding to swap

        // Step 2: Get estimated amount out from the DEX (WETH)
        let amountOutMin = BigInt(0);
        if (publicClient) {
          const path = [contractAddresses.base, WETH_ADDRESS];
          const amountsOut = await publicClient.readContract({
            address: DEX_ROUTER_ADDRESS,
            abi: DEX_ROUTER_ABI,
            functionName: 'getAmountsOut',
            args: [parseUnits(String(amount), 18), path],
          });
          // Apply a small slippage tolerance (e.g., 0.5%)
          amountOutMin = amountsOut[1] - (amountsOut[1] * BigInt(5) / BigInt(1000)); // 0.5% slippage
        }

        // Step 3: Execute the swap
        writeContract({
          address: DEX_ROUTER_ADDRESS,
          abi: DEX_ROUTER_ABI,
          functionName: 'swapExactTokensForTokens',
          args: [
            parseUnits(String(amount), 18), // amountIn (commodity token)
            amountOutMin, // amountOutMin (WETH)
            [contractAddresses.base, WETH_ADDRESS], // path: Commodity Token -> WETH
            address, // to: recipient of WETH
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

    } catch (error: any) {
      console.error("Sell operation error:", error);
      toast({
        title: "Sell Failed",
        description: `Error: ${error.message || 'An unexpected error occurred.'}`, 
        variant: "destructive",
      });
      return { success: false, message: error.message || "Sell operation failed." };
    }
  };

  // Effects for Base network transaction status
  useMemo(() => {
    if (isBaseConfirmed) {
      toast({
        title: "Transaction Confirmed",
        description: "Your transaction on Base network has been confirmed!",
        variant: "default",
      });
    }
  }, [isBaseConfirmed, toast]);

  useMemo(() => {
    if (isBaseWriteError && baseWriteError) {
      toast({
        title: "Base Transaction Failed",
        description: `Error sending transaction: ${baseWriteError.message}`,
        variant: "destructive",
      });
    }
  }, [isBaseWriteError, baseWriteError, toast]);

  useMemo(() => {
    if (isBaseConfirmError && baseConfirmError) {
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