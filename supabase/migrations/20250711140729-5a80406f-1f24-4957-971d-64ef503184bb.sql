-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT,
  total_portfolio_value DECIMAL(18,8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create commodity tokens table
CREATE TABLE public.commodity_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  blockchain TEXT NOT NULL DEFAULT 'base',
  decimals INTEGER DEFAULT 18,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user positions table
CREATE TABLE public.user_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commodity_symbol TEXT NOT NULL,
  token_balance DECIMAL(18,8) DEFAULT 0,
  average_buy_price DECIMAL(18,8) DEFAULT 0,
  total_invested DECIMAL(18,8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, commodity_symbol)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commodity_symbol TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
  token_amount DECIMAL(18,8) NOT NULL,
  price_per_token DECIMAL(18,8) NOT NULL,
  total_value DECIMAL(18,8) NOT NULL,
  transaction_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commodity_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view and update their own profile" ON public.profiles
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for commodity_tokens (public read)
CREATE POLICY "Anyone can view commodity tokens" ON public.commodity_tokens
  FOR SELECT USING (true);

-- Create RLS policies for user_positions
CREATE POLICY "Users can view their own positions" ON public.user_positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions" ON public.user_positions
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_positions_updated_at
  BEFORE UPDATE ON public.user_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial commodity tokens
INSERT INTO public.commodity_tokens (symbol, name, ticker, contract_address, blockchain) VALUES
  ('GOLD', 'Gold Token', 'GLD', '0x1234567890123456789012345678901234567890', 'base'),
  ('SILVER', 'Silver Token', 'SLV', '0x2345678901234567890123456789012345678901', 'base'),
  ('COPPER', 'Copper Token', 'CPR', '0x3456789012345678901234567890123456789012', 'base'),
  ('COCOA', 'Cocoa Token', 'COA', '0x7D8466C9737A21092d545BEDd5aBc702f7dE9353', 'base'),
  ('WHEAT', 'Wheat Token', 'WHT', '0x4567890123456789012345678901234567890123', 'base'),
  ('COFFEE', 'Coffee Token', 'CFE', '0x5678901234567890123456789012345678901234', 'base'),
  ('CORN', 'Corn Token', 'CRN', '0x6789012345678901234567890123456789012345', 'base'),
  ('SOYBEANS', 'Soybeans Token', 'SOY', '0x7890123456789012345678901234567890123456', 'base'),
  ('RICE', 'Rice Token', 'RCE', '0x8901234567890123456789012345678901234567', 'base'),
  ('SUGAR', 'Sugar Token', 'SGR', '0x9012345678901234567890123456789012345678', 'base'),
  ('COTTON', 'Cotton Token', 'CTN', '0xa123456789012345678901234567890123456789', 'base'),
  ('OIL', 'Crude Oil Token', 'OIL', '0xb234567890123456789012345678901234567890', 'base'),
  ('NATGAS', 'Natural Gas Token', 'GAS', '0xc345678901234567890123456789012345678901', 'base'),
  ('PLATINUM', 'Platinum Token', 'PLT', '0xd456789012345678901234567890123456789012', 'base'),
  ('PALLADIUM', 'Palladium Token', 'PLD', '0xe567890123456789012345678901234567890123', 'base'),
  ('ALUMINUM', 'Aluminum Token', 'ALU', '0xf678901234567890123456789012345678901234', 'base'),
  ('ZINC', 'Zinc Token', 'ZNC', '0x1789012345678901234567890123456789012345', 'base'),
  ('NICKEL', 'Nickel Token', 'NKL', '0x2890123456789012345678901234567890123456', 'base'),
  ('LITHIUM', 'Lithium Token', 'LTH', '0x3901234567890123456789012345678901234567', 'base'),
  ('URANIUM', 'Uranium Token', 'URN', '0x4012345678901234567890123456789012345678', 'base');