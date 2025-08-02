
import { CommodityCategory, CommodityPrice } from "@/types";

// Function to generate a unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Function to generate a random price change percentage between -3% and +3%
const generateRandomChange = (basePrice: number): { change: number, changePercent: number } => {
  const changePercent = (Math.random() * 6) - 3; // Between -3% and +3%
  const change = (basePrice * changePercent) / 100;
  return {
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2))
  };
};

// Helper function to create a commodity price object
const createCommodity = (
  name: string,
  price: number,
  unit: string,
  category: CommodityCategory,
  ticker?: string,
  contractAddresses?: { solana?: string }
): CommodityPrice => {
  const { change, changePercent } = generateRandomChange(price);
  
  return {
    id: generateId(),
    name,
    ticker,
    price,
    unit,
    change,
    changePercent,
    lastUpdate: new Date().toISOString(),
    category,
    contractAddresses,
  };
};

// Comprehensive list of commodities from Trading Economics
export const generateCommodities = (): CommodityPrice[] => {
  return [
    // Energy Commodities
    createCommodity("Crude Oil", 82.79, "USD/Bbl", CommodityCategory.Energy, "CL", { solana: "SOLANA_CRUDE_OIL_TOKEN_ADDRESS" }),
    createCommodity("Brent Oil", 84.91, "USD/Bbl", CommodityCategory.Energy, "BZ", { solana: "SOLANA_BRENT_OIL_TOKEN_ADDRESS" }),
    createCommodity("Natural Gas", 2.10, "USD/MMBtu", CommodityCategory.Energy, "NG", { solana: "HpNnAySB34qEHSBANp8dbUu7UqzPxZG5CktqbdKnC9Qp" }),
    createCommodity("Heating Oil", 2.64, "USD/Gal", CommodityCategory.Energy, "HO", { solana: "SOLANA_HEATING_OIL_TOKEN_ADDRESS" }),
    createCommodity("Gasoline", 2.43, "USD/Gal", CommodityCategory.Energy, "RB", { solana: "SOLANA_GASOLINE_TOKEN_ADDRESS" }),
    createCommodity("London Gas Oil", 735.38, "USD/MT", CommodityCategory.Energy, "LGO", { solana: "SOLANA_LONDON_GAS_OIL_TOKEN_ADDRESS" }),
    createCommodity("Coal", 148.75, "USD/T", CommodityCategory.Energy, "MTF", { solana: "SOLANA_COAL_TOKEN_ADDRESS" }),
    createCommodity("Ethanol", 1.35, "USD/Gal", CommodityCategory.Energy, "ACE", { solana: "SOLANA_ETHANOL_TOKEN_ADDRESS" }),
    createCommodity("Carbon", 67.24, "EUR/MT", CommodityCategory.Energy, "CFI", { solana: "SOLANA_CARBON_TOKEN_ADDRESS" }),
    createCommodity("UK Natural Gas", 88.52, "GBp/Thm", CommodityCategory.Energy, "NBP", { solana: "SOLANA_UK_NATURAL_GAS_TOKEN_ADDRESS" }),
    createCommodity("TTF Gas", 33.05, "EUR/MWh", CommodityCategory.Energy, "TTF", { solana: "SOLANA_TTF_GAS_TOKEN_ADDRESS" }),
    
    // Metals Commodities
    createCommodity("Gold", 2381.90, "USD/t oz.", CommodityCategory.Metals, "GC", { base: "0x000000000000000000000000000000000000000C", solana: "SOLANA_GOLD_TOKEN_ADDRESS" }),
    createCommodity("Silver", 28.14, "USD/t oz.", CommodityCategory.Metals, "SI", { base: "0x000000000000000000000000000000000000000D", solana: "SOLANA_SILVER_TOKEN_ADDRESS" }),
    createCommodity("Platinum", 943.80, "USD/t oz.", CommodityCategory.Metals, "PL", { base: "0x000000000000000000000000000000000000000E", solana: "SOLANA_PLATINUM_TOKEN_ADDRESS" }),
    createCommodity("Palladium", 1018.94, "USD/t oz.", CommodityCategory.Metals, "PA", { base: "0x000000000000000000000000000000000000000F", solana: "SOLANA_PALLADIUM_TOKEN_ADDRESS" }),
    createCommodity("Copper", 4.58, "USD/Lbs", CommodityCategory.Metals, "HG", { base: "0x0000000000000000000000000000000000000010", solana: "SOLANA_COPPER_TOKEN_ADDRESS" }),
    createCommodity("Aluminum", 2394.75, "USD/T", CommodityCategory.Metals, "ALI", { base: "0x0000000000000000000000000000000000000011", solana: "SOLANA_ALUMINUM_TOKEN_ADDRESS" }),
    createCommodity("Zinc", 2756.50, "USD/T", CommodityCategory.Metals, "ZS", { base: "0x0000000000000000000000000000000000000012", solana: "SOLANA_ZINC_TOKEN_ADDRESS" }),
    createCommodity("Nickel", 19046.00, "USD/T", CommodityCategory.Metals, "NI", { base: "0x0000000000000000000000000000000000000013", solana: "SOLANA_NICKEL_TOKEN_ADDRESS" }),
    createCommodity("Lead", 2155.25, "USD/T", CommodityCategory.Metals, "LL", { base: "0x0000000000000000000000000000000000000014", solana: "SOLANA_LEAD_TOKEN_ADDRESS" }),
    createCommodity("Iron Ore", 119.00, "USD/T", CommodityCategory.Metals, "TIO", { base: "0x0000000000000000000000000000000000000015", solana: "SOLANA_IRON_ORE_TOKEN_ADDRESS" }),
    createCommodity("Steel", 3984.00, "CNY/T", CommodityCategory.Metals, "HR", { base: "0x0000000000000000000000000000000000000016", solana: "SOLANA_STEEL_TOKEN_ADDRESS" }),
    createCommodity("Tin", 30212.00, "USD/T", CommodityCategory.Metals, "SN", { base: "0x0000000000000000000000000000000000000017", solana: "SOLANA_TIN_TOKEN_ADDRESS" }),
    createCommodity("Lithium", 139000.00, "CNY/T", CommodityCategory.Metals, "LI", { base: "0x0000000000000000000000000000000000000018", solana: "SOLANA_LITHIUM_TOKEN_ADDRESS" }),
    createCommodity("Uranium", 90.25, "USD/Lbs", CommodityCategory.Metals, "UX", { base: "0x0000000000000000000000000000000000000019", solana: "SOLANA_URANIUM_TOKEN_ADDRESS" }),
    createCommodity("Cobalt", 34200.00, "USD/T", CommodityCategory.Metals, "CO", { base: "0x000000000000000000000000000000000000001A", solana: "SOLANA_COBALT_TOKEN_ADDRESS" }),
    createCommodity("Molybdenum", 27.38, "USD/Lbs", CommodityCategory.Metals, "MO", { base: "0x000000000000000000000000000000000000001B", solana: "SOLANA_MOLYBDENUM_TOKEN_ADDRESS" }),
    createCommodity("Titanium", 8.50, "USD/Kg", CommodityCategory.Metals, "TI", { base: "0x000000000000000000000000000000000000001C", solana: "SOLANA_TITANIUM_TOKEN_ADDRESS" }),
    
    // Agriculture Commodities
    createCommodity("Wheat", 604.00, "USd/Bu", CommodityCategory.Agriculture, "W", { base: "0x000000000000000000000000000000000000001D", solana: "SOLANA_WHEAT_TOKEN_ADDRESS" }),
    createCommodity("Corn", 457.75, "USd/Bu", CommodityCategory.Agriculture, "C", { base: "0x000000000000000000000000000000000000001E", solana: "SOLANA_CORN_TOKEN_ADDRESS" }),
    createCommodity("Soybeans", 1203.50, "USd/Bu", CommodityCategory.Agriculture, "S", { base: "0x000000000000000000000000000000000000001F", solana: "SOLANA_SOYBEANS_TOKEN_ADDRESS" }),
    createCommodity("Rice", 17.01, "USD/cwt", CommodityCategory.Agriculture, "RR", { base: "0x0000000000000000000000000000000000000020", solana: "SOLANA_RICE_TOKEN_ADDRESS" }),
    createCommodity("Oats", 381.00, "USd/Bu", CommodityCategory.Agriculture, "O", { base: "0x0000000000000000000000000000000000000021", solana: "SOLANA_OATS_TOKEN_ADDRESS" }),
    createCommodity("Soybean Oil", 49.71, "USd/Lbs", CommodityCategory.Agriculture, "BO", { base: "0x0000000000000000000000000000000000000022", solana: "SOLANA_SOYBEAN_OIL_TOKEN_ADDRESS" }),
    createCommodity("Soybean Meal", 353.90, "USD/T", CommodityCategory.Agriculture, "SM", { base: "0x0000000000000000000000000000000000000023", solana: "SOLANA_SOYBEAN_MEAL_TOKEN_ADDRESS" }),
    createCommodity("Palm Oil", 3814.00, "MYR/T", CommodityCategory.Agriculture, "CPO", { base: "0x0000000000000000000000000000000000000024", solana: "SOLANA_PALM_OIL_TOKEN_ADDRESS" }),
    createCommodity("Canola", 714.80, "CAD/T", CommodityCategory.Agriculture, "RS", { base: "0x0000000000000000000000000000000000000025", solana: "SOLANA_CANOLA_TOKEN_ADDRESS" }),
    createCommodity("London Wheat", 203.10, "GBP/MT", CommodityCategory.Agriculture, "WTI", { base: "0x0000000000000000000000000000000000000026", solana: "SOLANA_LONDON_WHEAT_TOKEN_ADDRESS" }),
    createCommodity("Rapeseed", 502.75, "EUR/T", CommodityCategory.Agriculture, "REP", { base: "0x0000000000000000000000000000000000000027", solana: "SOLANA_RAPESEED_TOKEN_ADDRESS" }),
    createCommodity("Rough Rice", 16.12, "USD/cwt", CommodityCategory.Agriculture, "ZR", { base: "0x0000000000000000000000000000000000000028", solana: "SOLANA_ROUGH_RICE_TOKEN_ADDRESS" }),
    createCommodity("Feed Wheat", 225.00, "GBP/T", CommodityCategory.Agriculture, "FW", { base: "0x0000000000000000000000000000000000000029", solana: "SOLANA_FEED_WHEAT_TOKEN_ADDRESS" }),
    createCommodity("Hard Red Wheat", 694.25, "USd/Bu", CommodityCategory.Agriculture, "KW", { base: "0x000000000000000000000000000000000000002A", solana: "SOLANA_HARD_RED_WHEAT_TOKEN_ADDRESS" }),
    
    // Livestock Commodities
    createCommodity("Live Cattle", 187.38, "USd/Lbs", CommodityCategory.Livestock, "LC", { base: "0x000000000000000000000000000000000000002B", solana: "SOLANA_LIVE_CATTLE_TOKEN_ADDRESS" }),
    createCommodity("Feeder Cattle", 257.72, "USd/Lbs", CommodityCategory.Livestock, "FC", { base: "0x000000000000000000000000000000000000002C", solana: "SOLANA_FEEDER_CATTLE_TOKEN_ADDRESS" }),
    createCommodity("Lean Hogs", 94.85, "USd/Lbs", CommodityCategory.Livestock, "LH", { base: "0x000000000000000000000000000000000000002D", solana: "SOLANA_LEAN_HOGS_TOKEN_ADDRESS" }),
    createCommodity("Class III Milk", 19.95, "USD/cwt", CommodityCategory.Livestock, "DC", { base: "0x000000000000000000000000000000000000002E", solana: "SOLANA_CLASS_III_MILK_TOKEN_ADDRESS" }),
    createCommodity("Live Hogs", 19883.00, "CNY/T", CommodityCategory.Livestock, "JRO", { base: "0x000000000000000000000000000000000000002F", solana: "SOLANA_LIVE_HOGS_TOKEN_ADDRESS" }),
    createCommodity("Live Pork Bellies", 162.95, "USd/Lbs", CommodityCategory.Livestock, "PB", { base: "0x0000000000000000000000000000000000000030", solana: "SOLANA_LIVE_PORK_BELLIES_TOKEN_ADDRESS" }),
    
    // Softs Commodities
    createCommodity("Coffee", 2.24, "USD/Lbs", CommodityCategory.Softs, "KC", { base: "0x0000000000000000000000000000000000000031", solana: "SOLANA_COFFEE_TOKEN_ADDRESS" }),
    createCommodity("Cocoa", 10084.00, "USD/T", CommodityCategory.Softs, "CC", {
      base: "0x7D8466C9737A21092d545BEDd5aBc702f7dE9353", solana: "SOLANA_COCOA_TOKEN_ADDRESS"
    }),
    createCommodity("Sugar", 19.99, "USd/Lbs", CommodityCategory.Softs, "SB", { base: "0x0000000000000000000000000000000000000032", solana: "SOLANA_SUGAR_TOKEN_ADDRESS" }),
    createCommodity("Orange Juice", 408.50, "USd/Lbs", CommodityCategory.Softs, "OJ", { base: "0x0000000000000000000000000000000000000033", solana: "SOLANA_ORANGE_JUICE_TOKEN_ADDRESS" }),
    createCommodity("Cotton", 80.10, "USd/Lbs", CommodityCategory.Softs, "CT", { base: "0x0000000000000000000000000000000000000034", solana: "SOLANA_COTTON_TOKEN_ADDRESS" }),
    createCommodity("Lumber", 565.00, "USD/1000 bd ft", CommodityCategory.Softs, "LB", { base: "0x0000000000000000000000000000000000000035", solana: "SOLANA_LUMBER_TOKEN_ADDRESS" }),
    createCommodity("Rubber", 1.79, "USD/Kg", CommodityCategory.Softs, "RU", { base: "0x0000000000000000000000000000000000000036", solana: "SOLANA_RUBBER_TOKEN_ADDRESS" }),
    createCommodity("London Robusta Coffee", 3883.00, "USD/T", CommodityCategory.Softs, "RC", { base: "0x0000000000000000000000000000000000000037", solana: "SOLANA_LONDON_ROBUSTA_COFFEE_TOKEN_ADDRESS" }),
    createCommodity("London Sugar", 481.00, "USD/T", CommodityCategory.Softs, "LSU", { base: "0x0000000000000000000000000000000000000038", solana: "SOLANA_LONDON_SUGAR_TOKEN_ADDRESS" }),
    createCommodity("London Cocoa", 6503.00, "GBP/T", CommodityCategory.Softs, "LCC", { base: "0x0000000000000000000000000000000000000039", solana: "SOLANA_LONDON_COCOA_TOKEN_ADDRESS" }),
    
    // Indices Commodities
    createCommodity("Commodity Index", 326.44, "Index Points", CommodityCategory.Indices, "DJP", { base: "0x000000000000000000000000000000000000003A", solana: "SOLANA_COMMODITY_INDEX_TOKEN_ADDRESS" }),
    createCommodity("Gold Miners ETF", 33.24, "USD", CommodityCategory.Indices, "GDX", { base: "0x000000000000000000000000000000000000003B", solana: "SOLANA_GOLD_MINERS_ETF_TOKEN_ADDRESS" }),
    createCommodity("USD Index", 104.00, "Index Points", CommodityCategory.Indices, "DXY", { base: "0x000000000000000000000000000000000000003C", solana: "SOLANA_USD_INDEX_TOKEN_ADDRESS" }),
    createCommodity("S&P GSCI", 631.32, "Index Points", CommodityCategory.Indices, "GSG", { base: "0x000000000000000000000000000000000000003D", solana: "SOLANA_SP_GSCI_TOKEN_ADDRESS" }),
    createCommodity("Rogers Intl", 2786.91, "Index Points", CommodityCategory.Indices, "RJI", { base: "0x000000000000000000000000000000000000003E", solana: "SOLANA_ROGERS_INTL_TOKEN_ADDRESS" }),
    createCommodity("DJ Commodity", 454.81, "Index Points", CommodityCategory.Indices, "DJP", { base: "0x000000000000000000000000000000000000003F", solana: "SOLANA_DJ_COMMODITY_TOKEN_ADDRESS" }),
    createCommodity("MSCI World Commodity Producers", 392.93, "Index Points", CommodityCategory.Indices, "MSCWCP", { base: "0x0000000000000000000000000000000000000040", solana: "SOLANA_MSCI_WORLD_COMMODITY_PRODUCERS_TOKEN_ADDRESS" })
  ];
};
