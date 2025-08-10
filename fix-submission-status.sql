-- Fix for field_category column issue
-- This script adds the missing field_category column to the extracted_data table

-- First, let's check if the field_category column exists
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'extracted_data' 
        AND column_name = 'field_category'
    ) THEN
        -- Add the field_category column
        ALTER TABLE extracted_data 
        ADD COLUMN field_category field_category NOT NULL DEFAULT 'personal';
        
        RAISE NOTICE 'Added field_category column to extracted_data table';
    ELSE
        RAISE NOTICE 'field_category column already exists in extracted_data table';
    END IF;
END $$;

-- Also check if the validation_status column exists
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'extracted_data' 
        AND column_name = 'validation_status'
    ) THEN
        -- Add the validation_status column
        ALTER TABLE extracted_data 
        ADD COLUMN validation_status validation_status NOT NULL DEFAULT 'pending';
        
        RAISE NOTICE 'Added validation_status column to extracted_data table';
    ELSE
        RAISE NOTICE 'validation_status column already exists in extracted_data table';
    END IF;
END $$;

-- Also check if the validation_notes column exists
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'extracted_data' 
        AND column_name = 'validation_notes'
    ) THEN
        -- Add the validation_notes column
        ALTER TABLE extracted_data 
        ADD COLUMN validation_notes TEXT;
        
        RAISE NOTICE 'Added validation_notes column to extracted_data table';
    ELSE
        RAISE NOTICE 'validation_notes column already exists in extracted_data table';
    END IF;
END $$;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'extracted_data' 
ORDER BY ordinal_position; 