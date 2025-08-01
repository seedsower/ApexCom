import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTrade } from "@/hooks/useTrade";

interface TradeFormProps {
  commodityId: string;
  commodityName: string;
  currentPrice: number;
  contractAddresses?: { base?: string; solana?: string };
}

export function TradeForm({ commodityId, commodityName, currentPrice, contractAddresses }: TradeFormProps) {
  const [amount, setAmount] = useState<number>(1);
  const [network, setNetwork] = useState<'base' | 'solana'>('base');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const { buyCommodity, sellCommodity, isBaseTransactionPending, isBaseConfirming, isSolanaTransactionPending } = useTrade();

  const isLoading = isBaseTransactionPending || isBaseConfirming || isSolanaTransactionPending;

  const handleTrade = async () => {
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: `Please enter a positive amount to ${tradeType}.`,
        variant: "destructive",
      });
      return;
    }

    const result = tradeType === 'buy' 
      ? await buyCommodity(commodityId, amount, network, currentPrice, commodityName, contractAddresses)
      : await sellCommodity(commodityId, amount, network, currentPrice, commodityName, contractAddresses);

    if (result.success) {
      // No need for a toast here, useTrade hook handles success toasts
    } else {
      // useTrade hook handles error toasts, but we can add a generic one if needed
      toast({
        title: `${tradeType === 'buy' ? 'Buy' : 'Sell'} Failed`,
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-6 shadow-sm">
      <h3 className="text-xl font-semibold">Trade {commodityName}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="tradeType">Action</Label>
          <Select value={tradeType} onValueChange={(value: 'buy' | 'sell') => setTradeType(value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            min="0.1"
            step="0.1"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="network">Network</Label>
          <Select value={network} onValueChange={(value: 'base' | 'solana') => setNetwork(value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select Network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="base">Base</SelectItem>
              <SelectItem value="solana">Solana</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Current Price: ${currentPrice.toFixed(2)} {commodityName}/unit
        </p>
        <Button onClick={handleTrade} disabled={isLoading}>
          {isLoading ? `${tradeType === 'buy' ? 'Buying' : 'Selling'}...` : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${commodityName}`}
        </Button>
      </div>
    </div>
  );
} 