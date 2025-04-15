
import { useState, useEffect } from "react";
import { CommodityCategory, CommodityPrice } from "@/types";
import { PriceCard } from "@/components/PriceCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { priceService } from "@/services/priceService";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";

const Index = () => {
  const [commodities, setCommodities] = useState<CommodityPrice[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoUpdateActive, setAutoUpdateActive] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch commodity prices on component mount
  useEffect(() => {
    fetchPrices();
  }, []);

  // Function to fetch prices based on selected category
  const fetchPrices = async () => {
    try {
      setIsLoading(true);
      let prices: CommodityPrice[];
      
      if (selectedCategory === "all") {
        prices = await priceService.fetchCommodityPrices();
      } else {
        prices = await priceService.fetchCommodityPricesByCategory(
          selectedCategory as CommodityCategory
        );
      }
      
      setCommodities(prices);
      setLastUpdated(priceService.getLastScrapedTime());
    } catch (error) {
      console.error("Error fetching prices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    
    // If changing to a different category, refetch prices
    if (value !== selectedCategory) {
      setIsLoading(true);
      setTimeout(() => {
        fetchPrices();
      }, 100);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await priceService.scrapePrices();
    await priceService.updateOracles();
    await fetchPrices();
    setIsRefreshing(false);
  };

  // Toggle automatic updates
  const toggleAutomaticUpdates = () => {
    if (autoUpdateActive) {
      priceService.stopAutomaticUpdates();
      setAutoUpdateActive(false);
    } else {
      priceService.startAutomaticUpdates(fetchPrices);
      setAutoUpdateActive(true);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <div className="relative bg-muted/30 px-4 py-8 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold sm:text-4xl">Oracle Price Feed</h1>
              <p className="max-w-3xl text-muted-foreground">
                Real-time commodity prices scraped from Trading Economics and synchronized 
                with blockchain oracles every 6 hours.
              </p>
            </div>

            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex gap-2">
                <Button 
                  onClick={handleRefresh} 
                  variant="secondary" 
                  className="gap-2" 
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCwIcon className="h-4 w-4" />
                  )}
                  Refresh Prices
                </Button>
                
                <Button 
                  onClick={toggleAutomaticUpdates} 
                  variant={autoUpdateActive ? "destructive" : "outline"} 
                  className="gap-2"
                >
                  {autoUpdateActive ? "Stop Auto-Updates" : "Start Auto-Updates"}
                </Button>
              </div>
              
              {lastUpdated && (
                <div className="text-sm text-muted-foreground">
                  Last updated: {lastUpdated.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Tabs 
          defaultValue="all" 
          value={selectedCategory} 
          onValueChange={handleCategoryChange}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Commodities</TabsTrigger>
            <TabsTrigger value={CommodityCategory.Energy}>Energy</TabsTrigger>
            <TabsTrigger value={CommodityCategory.Metals}>Metals</TabsTrigger>
            <TabsTrigger value={CommodityCategory.Agriculture}>Agriculture</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-0">
            {isLoading ? (
              <div className="flex h-60 items-center justify-center">
                <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {commodities.map((commodity) => (
                  <PriceCard key={commodity.id} commodity={commodity} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
