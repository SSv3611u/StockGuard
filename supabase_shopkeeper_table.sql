-- Run this SQL in your Supabase SQL Editor
-- Creates the Shopkeeper table for 2FA login

CREATE TABLE IF NOT EXISTS public."Shopkeeper" (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "shopId" uuid REFERENCES public."Shop"(id),
    "shopName" text NOT NULL,
    email text NOT NULL UNIQUE,
    "passwordHash" text NOT NULL,
    "phoneNumber" text NOT NULL,
    "otpCode" text,
    "otpExpiry" timestamp with time zone,
    "otpAttempts" integer DEFAULT 0,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public."Shopkeeper" ENABLE ROW LEVEL SECURITY;

-- Policies (allow server-side access via service key or anon for our use case)
CREATE POLICY "Allow public read on Shopkeeper" ON public."Shopkeeper"
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on Shopkeeper" ON public."Shopkeeper"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on Shopkeeper" ON public."Shopkeeper"
    FOR UPDATE USING (true);

-- Index for fast login lookups
CREATE INDEX IF NOT EXISTS idx_shopkeeper_email ON public."Shopkeeper" (email);

-- =============================================
-- SEED: Create a default shopkeeper account
-- Password: "stockguard123" (bcrypt hash)
-- Phone: Use your actual phone number with country code
-- =============================================
-- IMPORTANT: Replace the phone number below with your real number!

INSERT INTO public."Shopkeeper" ("shopId", "shopName", email, "passwordHash", "phoneNumber")
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Ram Medical Store',
    'admin@stockguard.com',
    '$2b$10$9ivaqffRhm93ghiGgjWbGO7G7mYdCJjmuC.nT4YifVDOMIPQ.Cab6',
    '+919876543210'
)
ON CONFLICT (email) DO NOTHING;
