-- Migration: Add Diamond payment support to payments table
-- Created: November 07, 2025

-- Add new columns for diamond payments
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS amount_diamonds INTEGER DEFAULT 0;

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'bflx';

-- Update existing records to have default values
UPDATE payments 
SET payment_type = 'bflx', amount_diamonds = 0 
WHERE payment_type IS NULL OR payment_type = '';

-- Verify migration
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name IN ('amount_diamonds', 'payment_type');
