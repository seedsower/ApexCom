import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradeRequest {
  commoditySymbol: string;
  tradeType: 'buy' | 'sell';
  tokenAmount: number;
  pricePerToken: number;
  transactionHash?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { commoditySymbol, tradeType, tokenAmount, pricePerToken, transactionHash }: TradeRequest = await req.json();

    // Validate input
    if (!commoditySymbol || !tradeType || !tokenAmount || !pricePerToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const totalValue = tokenAmount * pricePerToken;

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: user.id,
        commodity_symbol: commoditySymbol,
        transaction_type: tradeType,
        token_amount: tokenAmount,
        price_per_token: pricePerToken,
        total_value: totalValue,
        transaction_hash: transactionHash,
        status: 'confirmed'
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Update user position
    const { data: existingPosition } = await supabaseClient
      .from('user_positions')
      .select('*')
      .eq('user_id', user.id)
      .eq('commodity_symbol', commoditySymbol)
      .single();

    let positionUpdate;
    
    if (existingPosition) {
      // Update existing position
      if (tradeType === 'buy') {
        const newBalance = Number(existingPosition.token_balance) + tokenAmount;
        const newTotalInvested = Number(existingPosition.total_invested) + totalValue;
        const newAveragePrice = newTotalInvested / newBalance;
        
        positionUpdate = {
          token_balance: newBalance,
          total_invested: newTotalInvested,
          average_buy_price: newAveragePrice
        };
      } else {
        // Sell operation
        const newBalance = Number(existingPosition.token_balance) - tokenAmount;
        const proportionSold = tokenAmount / Number(existingPosition.token_balance);
        const newTotalInvested = Number(existingPosition.total_invested) * (1 - proportionSold);
        
        positionUpdate = {
          token_balance: Math.max(0, newBalance),
          total_invested: Math.max(0, newTotalInvested)
        };
      }

      const { error: updateError } = await supabaseClient
        .from('user_positions')
        .update(positionUpdate)
        .eq('id', existingPosition.id);

      if (updateError) {
        console.error('Position update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update position' }),
          { status: 500, headers: corsHeaders }
        );
      }
    } else if (tradeType === 'buy') {
      // Create new position
      const { error: insertError } = await supabaseClient
        .from('user_positions')
        .insert({
          user_id: user.id,
          commodity_symbol: commoditySymbol,
          token_balance: tokenAmount,
          average_buy_price: pricePerToken,
          total_invested: totalValue
        });

      if (insertError) {
        console.error('Position insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create position' }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction,
        message: `Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${tokenAmount} ${commoditySymbol} tokens`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Trade error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});