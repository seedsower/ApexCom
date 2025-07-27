import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

// Default to devnet for development
export const SOLANA_NETWORK = WalletAdapterNetwork.Devnet;
export const SOLANA_RPC_ENDPOINT = clusterApiUrl('devnet');

export const useSolanaWallets = () => {
  return useMemo(() => {
    // Simplified approach: Start with just Phantom to avoid MetaMask conflicts
    // We can add other wallets back once the main trading functionality is working
    const wallets = [
      new PhantomWalletAdapter(),
    ];
    
    console.log('Solana wallets (simplified):', wallets.map(w => w.name));
    return wallets;
  }, []);
};

export const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');