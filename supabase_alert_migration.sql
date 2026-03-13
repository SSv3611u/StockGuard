-- Run this SQL in your Supabase SQL Editor to add the alert_sent column
ALTER TABLE public."Batch" ADD COLUMN IF NOT EXISTS "alert_sent" BOOLEAN DEFAULT false;
