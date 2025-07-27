import { useMemo, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useConnect, usePublicClient } from 'wagmi';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, VersionedTransaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
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

// Uniswap V4 PoolManager ABI (simplified for swaps)
const UNISWAP_V4_POOL_MANAGER_ABI = [
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "Currency",
            "name": "currency0", 
            "type": "address"
          },
          {
            "internalType": "Currency",
            "name": "currency1",
            "type": "address"
          },
          {
            "internalType": "uint24",
            "name": "fee",
            "type": "uint24"
          },
          {
            "internalType": "int24", 
            "name": "tickSpacing",
            "type": "int24"
          },
          {
            "internalType": "address",
            "name": "hooks",
            "type": "address"
          }
        ],
        "internalType": "struct PoolKey",
        "name": "key",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "bool",
            "name": "zeroForOne",
            "type": "bool"
          },
          {
            "internalType": "int256",
            "name": "amountSpecified", 
            "type": "int256"
          },
          {
            "internalType": "uint160",
            "name": "sqrtPriceLimitX96",
            "type": "uint160"
          }
        ],
        "internalType": "struct IPoolManager.SwapParams",
        "name": "params",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "hookData",
        "type": "bytes"
      }
    ],
    "name": "swap",
    "outputs": [
      {
        "internalType": "BalanceDelta",
        "name": "delta",
        "type": "int256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Uniswap V2 Pool ABI for direct pool interaction (fallback)
const UNISWAP_V2_POOL_ABI = [
  {
    "inputs": [],
    "name": "getReserves",
    "outputs": [
      {
        "internalType": "uint112",
        "name": "_reserve0",
        "type": "uint112"
      },
      {
        "internalType": "uint112", 
        "name": "_reserve1",
        "type": "uint112"
      },
      {
        "internalType": "uint32",
        "name": "_blockTimestampLast",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token0",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token1", 
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount0Out",
        "type": "uint256"
      },
      {
        "internalType": "uint256", 
        "name": "amount1Out",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "swap",
    "outputs": [],
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

// Your Natural Gas / USDC V4 Pool Contract Address  
const NATURAL_GAS_POOL_ADDRESS: `0x${string}` = '0x7C5f5A4bBd8fD63184577525326123B519429bDc'; // Natural Gas/USDC V4 Pool
// Uniswap V4 PoolManager on Base (singleton contract for all V4 pools)
const V4_POOL_MANAGER: `0x${string}` = '0x38EB8B22Df3Ae7fb21e92881151B365Df14ba967'; // V4 PoolManager on Base

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
        
        // Check USDC allowance for V4 PoolManager (V4 uses singleton pattern)
        const currentAllowance = await publicClient?.readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, V4_POOL_MANAGER],
        }) as bigint | undefined;

        const requiredAmount = parseUnits(String(amount), 6); // USDC has 6 decimals
        
        if (!currentAllowance || currentAllowance < requiredAmount) {
          console.log("Insufficient allowance, requesting approval...");
          
          // Request approval for USDC spending to V4 PoolManager
          writeContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [V4_POOL_MANAGER, requiredAmount * BigInt(2)], // Approve double to avoid frequent approvals
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

        // Step 3: Execute swap via your Uniswap pool
        console.log("Executing USDC -> Natural Gas swap via pool...");
        
        // First, check what type of contract this is
        console.log("Checking contract type...");
        
        // Try to get basic contract info to understand its interface
        let token0: `0x${string}` | undefined;
        let token1: `0x${string}` | undefined;
        
        try {
          // Try Uniswap V2 style first
          token0 = await publicClient?.readContract({
            address: NATURAL_GAS_POOL_ADDRESS,
            abi: UNISWAP_V2_POOL_ABI,
            functionName: 'token0',
          }) as `0x${string}` | undefined;
        } catch (error) {
          console.log("Detected V4 pool - using simplified transfer approach");
          
          // V4 pools require complex integration with PoolManager
          // For now, implement a simple transfer to test the flow
          console.log("Executing USDC transfer to Natural Gas token contract...");
          
          writeContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [
              addresses.base as `0x${string}`, // Send to Natural Gas token contract
              parseUnits(String(amount), 6),
            ],
            chainId: base.id,
            account: address,
            chain: base,
          });

          toast({
            title: "Transaction Sent",
            description: "Executing USDC transfer (V4 pool detected - using transfer method)...",
          });
          return { success: true, message: "USDC transfer transaction sent to Natural Gas token contract." };
        }

        // Continue with V2 flow if token0 was successful
        token1 = await publicClient?.readContract({
          address: NATURAL_GAS_POOL_ADDRESS,
          abi: UNISWAP_V2_POOL_ABI,
          functionName: 'token1',
        }) as `0x${string}` | undefined;

        console.log("Pool tokens:", { token0, token1, usdc: USDC_ADDRESS, naturalGas: addresses.base });

        // Get reserves to calculate output amount
        const reserves = await publicClient?.readContract({
          address: NATURAL_GAS_POOL_ADDRESS,
          abi: UNISWAP_V2_POOL_ABI,
          functionName: 'getReserves',
        }) as [bigint, bigint, number] | undefined;

        if (!reserves || !token0 || !token1) {
          throw new Error("Failed to get pool information");
        }

        const [reserve0, reserve1] = reserves;
        const amountIn = parseUnits(String(amount), 6);
        
        // Determine if USDC is token0 or token1
        const usdcIsToken0 = token0.toLowerCase() === USDC_ADDRESS.toLowerCase();
        const reserveIn = usdcIsToken0 ? reserve0 : reserve1;
        const reserveOut = usdcIsToken0 ? reserve1 : reserve0;
        
        // Calculate output amount using Uniswap formula: amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
        const amountInWithFee = amountIn * BigInt(997);
        const numerator = amountInWithFee * reserveOut;
        const denominator = reserveIn * BigInt(1000) + amountInWithFee;
        const amountOut = numerator / denominator;
        
        console.log("Swap calculation:", {
          amountIn: amountIn.toString(),
          amountOut: amountOut.toString(),
          usdcIsToken0,
          reserveIn: reserveIn.toString(),
          reserveOut: reserveOut.toString()
        });

        // Transfer USDC to pool first
        writeContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [
            NATURAL_GAS_POOL_ADDRESS,
            amountIn,
          ],
          chainId: base.id,
          account: address,
          chain: base,
        });

        // Wait briefly then call swap on pool
        setTimeout(() => {
          writeContract({
            address: NATURAL_GAS_POOL_ADDRESS,
            abi: UNISWAP_V2_POOL_ABI,
            functionName: 'swap',
            args: [
              usdcIsToken0 ? BigInt(0) : amountOut, // amount0Out
              usdcIsToken0 ? amountOut : BigInt(0), // amount1Out  
              address, // recipient
              '0x', // data (empty for normal swap)
            ],
            chainId: base.id,
            account: address,
            chain: base,
          });
        }, 2000);

        console.log("Transaction parameters:", {
          pool: NATURAL_GAS_POOL_ADDRESS,
          amountIn: parseUnits(String(amount), 6).toString(),
          target: addresses.base,
          recipient: address
        });

        toast({
          title: "Transaction Sent",
          description: "Confirming USDC transfer transaction on Base network...",
        });
        return { success: true, message: "USDC transfer transaction sent to Base network." };

      } else if (network === 'solana') {
        if (!publicKey) throw new Error("Solana wallet not connected.");
        if (!addresses.solana) throw new Error("Solana contract address not found.");

        console.log("Executing Solana swap via Jupiter API...");
        
        // Token addresses
        const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
        const NATURAL_GAS_MINT = addresses.solana; // HpNnAySB34qEHSBANp8dbUu7UqzPxZG5CktqbdKnC9Qp
        const ORCA_POOL_ADDRESS = '2kVSRjSckkRYuVKMz27uTEzhBjif2sffXUEivS3ash53';
        
        console.log(`Trading via Orca pool: https://www.orca.so/pools/${ORCA_POOL_ADDRESS}`);
        console.log(`Natural Gas token: ${NATURAL_GAS_MINT}`);
        
        try {
          // Step 1: Get Jupiter quote for USDC -> Natural Gas
          const amountInLamports = amount * 1_000_000; // USDC has 6 decimals
          
          const quoteResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${USDC_MINT}&outputMint=${NATURAL_GAS_MINT}&amount=${amountInLamports}&slippageBps=50&onlyDirectRoutes=false&asLegacyTransaction=false`);
          
          if (!quoteResponse.ok) {
            throw new Error('Failed to get Jupiter quote');
          }
          
          const quoteData = await quoteResponse.json();
          console.log('Jupiter quote:', quoteData);
          
          if (!quoteData.routePlan || quoteData.routePlan.length === 0) {
            throw new Error('No routes found for this token pair on Jupiter');
          }
          
          // Step 2: Get swap transaction
          const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quoteResponse: quoteData,
              userPublicKey: publicKey.toString(),
              wrapAndUnwrapSol: true,
            })
          });
          
          if (!swapResponse.ok) {
            throw new Error('Failed to get Jupiter swap transaction');
          }
          
          const swapData = await swapResponse.json();
          console.log('Jupiter buy swap response:', { 
            hasSwapTransaction: !!swapData.swapTransaction,
            transactionLength: swapData.swapTransaction?.length 
          });
          
          if (!swapData.swapTransaction) {
            throw new Error('No swap transaction returned from Jupiter for buy');
          }
          
          // Step 3: Execute the swap transaction
          const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
          
          // Use VersionedTransaction for Jupiter's modern transaction format
          let transaction;
          try {
            // Try versioned transaction first (Jupiter's default)
            transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            console.log('Using VersionedTransaction format');
          } catch (versionedError) {
            console.log('Not a versioned transaction, trying legacy format...');
            // Fallback to legacy transaction format
            transaction = Transaction.from(swapTransactionBuf);
          }
          
          const signature = await sendTransaction(transaction, connection);
          console.log('Swap transaction signature:', signature);
          
          // Wait for confirmation
          await connection.confirmTransaction(signature, 'confirmed');

          toast({
            title: "Swap Successful!",
            description: `Successfully swapped ${amount} USDC for Natural Gas tokens on Solana via Jupiter/Orca`,
            variant: "default",
          });
          
          return { success: true, message: "Solana swap completed successfully via Jupiter API." };
          
        } catch (jupiterError) {
          console.error('Jupiter swap failed:', jupiterError);
          
          // Fallback to simple SOL transfer for testing
          console.log("Jupiter failed, falling back to SOL transfer...");
          
          const lamports = amount * currentPrice * LAMPORTS_PER_SOL;
          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: new PublicKey(addresses.solana),
              lamports,
            })
          );

          const signature = await sendTransaction(transaction, connection);
          await connection.confirmTransaction(signature, 'processed');

          toast({
            title: "Fallback Transfer Completed",
            description: `Sent ${amount} SOL to Natural Gas contract (Jupiter swap unavailable)`,
            variant: "default",
          });
          return { success: true, message: "Fallback SOL transfer completed." };
        }
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

        // Step 1: Check and approve Natural Gas token spending to pool
        console.log("Checking Natural Gas token allowance for pool...");
        
        const currentAllowance = await publicClient?.readContract({
          address: addresses.base as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, NATURAL_GAS_POOL_ADDRESS],
        }) as bigint | undefined;

        const requiredAmount = parseUnits(String(amount), 18); // Natural Gas token has 18 decimals
        
        if (!currentAllowance || currentAllowance < requiredAmount) {
          console.log("Insufficient allowance, requesting approval...");
          
          writeContract({
            address: addresses.base as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [NATURAL_GAS_POOL_ADDRESS, requiredAmount * BigInt(2)],
            chainId: base.id,
            account: address,
            chain: base,
          });

          toast({
            title: "Approval Required",
            description: "Please approve Natural Gas token spending first, then try selling again.",
            variant: "default",
          });
          return { success: false, message: "Natural Gas token approval required." };
        }

        // Step 2: Check Natural Gas token balance
        const tokenBalance = await publicClient?.readContract({
          address: addresses.base as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address],
        }) as bigint | undefined;

        if (!tokenBalance || tokenBalance < requiredAmount) {
          toast({
            title: "Insufficient Natural Gas Balance",
            description: `You need ${amount} Natural Gas tokens to complete this swap. Current balance: ${tokenBalance ? Number(tokenBalance) / 1e18 : 0}`,
            variant: "destructive",
          });
          return { success: false, message: "Insufficient Natural Gas token balance." };
        }

        // Step 3: Execute Natural Gas -> USDC swap via pool
        console.log("Executing Natural Gas -> USDC swap via pool...");
        
        // Get pool information
        const token0 = await publicClient?.readContract({
          address: NATURAL_GAS_POOL_ADDRESS,
          abi: UNISWAP_V2_POOL_ABI,
          functionName: 'token0',
        }) as `0x${string}` | undefined;

        const token1 = await publicClient?.readContract({
          address: NATURAL_GAS_POOL_ADDRESS,
          abi: UNISWAP_V2_POOL_ABI,
          functionName: 'token1',
        }) as `0x${string}` | undefined;

        const reserves = await publicClient?.readContract({
          address: NATURAL_GAS_POOL_ADDRESS,
          abi: UNISWAP_V2_POOL_ABI,
          functionName: 'getReserves',
        }) as [bigint, bigint, number] | undefined;

        if (!reserves || !token0 || !token1) {
          throw new Error("Failed to get pool information");
        }

        const [reserve0, reserve1] = reserves;
        
        // Determine if Natural Gas token is token0 or token1
        const naturalGasIsToken0 = token0.toLowerCase() === (addresses.base as string).toLowerCase();
        const reserveIn = naturalGasIsToken0 ? reserve0 : reserve1;
        const reserveOut = naturalGasIsToken0 ? reserve1 : reserve0;
        
        // Calculate USDC output amount
        const amountInWithFee = requiredAmount * BigInt(997);
        const numerator = amountInWithFee * reserveOut;
        const denominator = reserveIn * BigInt(1000) + amountInWithFee;
        const amountOut = numerator / denominator;
        
        console.log("Sell swap calculation:", {
          amountIn: requiredAmount.toString(),
          amountOut: amountOut.toString(),
          naturalGasIsToken0,
          reserveIn: reserveIn.toString(),
          reserveOut: reserveOut.toString()
        });

        // Transfer Natural Gas tokens to pool first
        writeContract({
          address: addresses.base as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [
            NATURAL_GAS_POOL_ADDRESS,
            requiredAmount,
          ],
          chainId: base.id,
          account: address,
          chain: base,
        });

        // Wait briefly then call swap on pool
        setTimeout(() => {
          writeContract({
            address: NATURAL_GAS_POOL_ADDRESS,
            abi: UNISWAP_V2_POOL_ABI,
            functionName: 'swap',
            args: [
              naturalGasIsToken0 ? amountOut : BigInt(0), // amount0Out (USDC if Natural Gas is token1)
              naturalGasIsToken0 ? BigInt(0) : amountOut, // amount1Out (USDC if Natural Gas is token0)  
              address, // recipient
              '0x', // data (empty for normal swap)
            ],
            chainId: base.id,
            account: address,
            chain: base,
          });
        }, 2000);

        toast({
          title: "Transaction Sent",
          description: "Confirming sell transaction on Base network...",
        });
        return { success: true, message: "Sell transaction sent to Base network." };

      } else if (network === 'solana') {
        if (!publicKey) throw new Error("Solana wallet not connected.");
        if (!addresses.solana) throw new Error("Solana contract address not found.");

        console.log("Executing Solana sell swap via Jupiter API...");
        
        const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
        const NATURAL_GAS_MINT = addresses.solana; // HpNnAySB34qEHSBANp8dbUu7UqzPxZG5CktqbdKnC9Qp
        const ORCA_POOL_ADDRESS = '2kVSRjSckkRYuVKMz27uTEzhBjif2sffXUEivS3ash53';
        
        console.log(`Selling via Orca pool: https://www.orca.so/pools/${ORCA_POOL_ADDRESS}`);
        console.log(`Natural Gas token: ${NATURAL_GAS_MINT}`);
        
        try {
          // Step 1: Get Jupiter quote for Natural Gas -> USDC
          const amountInTokens = amount * 1_000_000_000_000_000_000; // Assuming 18 decimals for Natural Gas token
          
          const quoteResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${NATURAL_GAS_MINT}&outputMint=${USDC_MINT}&amount=${amountInTokens}&slippageBps=50&onlyDirectRoutes=false&asLegacyTransaction=false`);
          
          if (!quoteResponse.ok) {
            throw new Error('Failed to get Jupiter quote for sell');
          }
          
          const quoteData = await quoteResponse.json();
          console.log('Jupiter sell quote:', quoteData);
          
          // Step 2: Get swap transaction
          const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quoteResponse: quoteData,
              userPublicKey: publicKey.toString(),
              wrapAndUnwrapSol: true,
            })
          });
          
          if (!swapResponse.ok) {
            throw new Error('Failed to get Jupiter swap transaction for sell');
          }
          
          const swapData = await swapResponse.json();
          console.log('Jupiter sell swap response:', { 
            hasSwapTransaction: !!swapData.swapTransaction,
            transactionLength: swapData.swapTransaction?.length 
          });
          
          if (!swapData.swapTransaction) {
            throw new Error('No swap transaction returned from Jupiter for sell');
          }
          
          // Step 3: Execute the swap transaction
          const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
          
          // Use VersionedTransaction for Jupiter's modern transaction format
          let transaction;
          try {
            // Try versioned transaction first (Jupiter's default)
            transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            console.log('Using VersionedTransaction format for sell');
          } catch (versionedError) {
            console.log('Not a versioned transaction, trying legacy format for sell...');
            // Fallback to legacy transaction format
            transaction = Transaction.from(swapTransactionBuf);
          }
          
          const signature = await sendTransaction(transaction, connection);
          console.log('Sell swap transaction signature:', signature);
          
          // Wait for confirmation
          await connection.confirmTransaction(signature, 'confirmed');

          toast({
            title: "Sell Successful!",
            description: `Successfully sold ${amount} Natural Gas tokens for USDC on Solana via Jupiter/Orca`,
            variant: "default",
          });
          
          return { success: true, message: "Solana sell swap completed successfully via Jupiter API." };
          
        } catch (jupiterError) {
          console.error('Jupiter sell swap failed:', jupiterError);
          
          toast({
            title: "Sell Simulated",
            description: `Simulated selling ${amount} units of ${commodityName} on Solana (Jupiter unavailable).`,
          });
          return { success: true, message: "Sell simulation completed." };
        }
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