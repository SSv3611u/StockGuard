-- Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This creates the Sales table needed for sales tracking and restock recommendations.

CREATE TABLE IF NOT EXISTS public."Sales" (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "shopId" text NOT NULL,
    "productId" uuid NOT NULL,
    "batchId" uuid NOT NULL,
    "productName" text NOT NULL,
    quantity integer NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security (matching existing tables)
ALTER TABLE public."Sales" ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads and inserts (matching existing Supabase pattern)
CREATE POLICY "Allow public read on Sales" ON public."Sales"
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on Sales" ON public."Sales"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on Sales" ON public."Sales"
    FOR UPDATE USING (true);

-- Create index for faster dashboard queries
CREATE INDEX IF NOT EXISTS idx_sales_shopid_createdat ON public."Sales" ("shopId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_sales_productid ON public."Sales" ("productId");
