
import { CommodityPrice } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRightIcon, ArrowUpRightIcon, CoinsIcon, LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PriceCardProps {
  commodity: CommodityPrice;
  showDetails?: boolean;
}

export function PriceCard({ commodity, showDetails = true }: PriceCardProps) {
  const navigate = useNavigate();
  const { id, name, ticker, price, unit, change, changePercent, lastUpdate, category, contractAddresses } = commodity;
  
  const formattedDate = new Date(lastUpdate).toLocaleString();
  const isPositive = change >= 0;
  
  // Determine if tokenization is available based on the presence of a ticker
  // This assumes that if a ticker is defined, the commodity is intended to be tokenized.
  const isTokenizationAvailable = !!ticker;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-medium">{name}</CardTitle>
        <span className="text-muted-foreground text-sm">{ticker || "-"}</span>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-2xl font-bold">
          {formatCurrency(price)}
          <span className="text-sm text-muted-foreground">/{unit}</span>
        </div>
        <p className={cn("text-xs flex items-center gap-1", isPositive ? "text-green-500" : "text-red-500")}>
          {isPositive ? <ArrowUpRightIcon className="h-3 w-3" /> : <ArrowDownRightIcon className="h-3 w-3" />}
          {formatCurrency(change)} ({formatPercent(changePercent)})
        </p>

        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CoinsIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tokens</span>
              <Badge
                variant={isTokenizationAvailable ? "default" : "secondary"}
                className="text-xs"
              >
                {isTokenizationAvailable ? "Available" : "Coming Soon"}
              </Badge>
            </div>
          </div>

          {/* Ethereum Tokens */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Base Network:</span>
              <div className="flex items-center gap-1">
                <Badge variant={!!contractAddresses?.base ? "default" : "secondary"} className="text-xs">
                  {ticker || 'TKN'}
                </Badge>
                {contractAddresses?.base && contractAddresses.base !== "" && (
                  <span className="font-mono text-[10px]">
                    {contractAddresses.base.slice(0, 6)}...{contractAddresses.base.slice(-4)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Solana Tokens */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Solana:</span>
              <div className="flex items-center gap-1">
                <Badge variant={!!contractAddresses?.solana ? "default" : "secondary"} className="text-xs">
                  SOL-{ticker || 'TKN'}
                </Badge>
                {contractAddresses?.solana && contractAddresses.solana !== "" && (
                  <span className="font-mono text-[10px]">
                    {contractAddresses.solana.slice(0, 6)}...{contractAddresses.solana.slice(-4)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Updated: {formattedDate}
        </div>
      </CardContent>
      
      {showDetails && (
        <CardFooter className="pt-0 flex-col gap-2">
          <div className="flex w-full gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 justify-start gap-2 text-xs"
              onClick={() => navigate(`/commodity/${id}`)}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              View Oracle Details
            </Button>
            <Button 
              variant={isTokenizationAvailable ? "default" : "secondary"}
              size="sm" 
              className="flex-1 justify-center gap-2 text-xs"
              disabled={!isTokenizationAvailable}
              onClick={() => console.log(`Tokenize ${name} on multiple chains`)} // TODO: Implement multi-chain tokenization
            >
              <CoinsIcon className="h-3.5 w-3.5" />
              {isTokenizationAvailable ? "Tokenize" : "Coming Soon"}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
