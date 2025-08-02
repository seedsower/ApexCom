import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletIcon, LogOutIcon, NetworkIcon, CopyIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function WalletConnection() {
  // Solana wallet state
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  
  const { toast } = useToast();

  const copyAddress = async (addressToCopy: string) => {
    if (addressToCopy) {
      await navigator.clipboard.writeText(addressToCopy);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Connected state
  if (connected && publicKey) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5" />
              <CardTitle className="text-lg">Wallet Connected</CardTitle>
            </div>
            <Badge variant="default" className="bg-green-500 text-white">
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription>Connected to Solana Network</CardDescription>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Address:</span>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {formatAddress(publicKey.toBase58())}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyAddress(publicKey.toBase58())}
                >
                  <CopyIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Network:</span>
              <div className="flex items-center gap-2">
                <NetworkIcon className="h-4 w-4" />
                <span className="text-sm">Solana Devnet</span>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => disconnect()}
          >
            <LogOutIcon className="h-4 w-4 mr-2" />
            Disconnect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Disconnected state
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <WalletIcon className="h-5 w-5" />
          <CardTitle className="text-lg">Connect Solana Wallet</CardTitle>
        </div>
        <CardDescription>
          Connect your Solana wallet to start trading tokenized commodities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full">
          <WalletMultiButton className="!w-full !justify-center !bg-background !text-foreground !border !border-input hover:!bg-accent hover:!text-accent-foreground" />
        </div>
        <div className="text-xs text-muted-foreground text-center">
          Supported wallets: Phantom, Solflare, Torus, Ledger
        </div>
      </CardContent>
    </Card>
  );
}