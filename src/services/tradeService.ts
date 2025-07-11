export const tradeService = {
  buyCommodity: async (commodityId: string, amount: number, network: 'base' | 'solana') => {
    console.log(`Simulating buy of ${amount} units of ${commodityId} on ${network} network.`);
    return { success: true, message: 'Commodity bought successfully (simulated).' };
  },

  sellCommodity: async (commodityId: string, amount: number, network: 'base' | 'solana') => {
    console.log(`Simulating sell of ${amount} units of ${commodityId} on ${network} network.`);
    return { success: true, message: 'Commodity sold successfully (simulated).' };
  }
}; 