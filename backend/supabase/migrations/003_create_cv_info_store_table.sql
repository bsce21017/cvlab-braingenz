-- Migration: Create cv_info_store table
-- Description: Stores optimized CV S3 file paths and metadata extraction status
-- Date: 2025-01-19

-- Create enum type for metadata status
DO $$ BEGIN
    CREATE TYPE metadatastatus AS ENUM ('PENDING', 'DONE', 'ERROR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create cv_info_store table
CREATE TABLE IF NOT EXISTS cv_info_store (
    id SERIAL PRIMARY KEY,

    -- S3 file paths for optimized CV (managed by Waleed's developer)
    text_s3_file_path VARCHAR(1000),
    pdf_s3_file_path VARCHAR(1000),

    -- Timestamp when record was added
    date_added TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Metadata extraction fields (managed by other developer)
    metadata_status metadatastatus NOT NULL DEFAULT 'PENDING',
    metadata_extracted_at TIMESTAMPTZ,
    extracted_metadata JSONB,
    metadata_model VARCHAR(100),
    metadata_error TEXT
);

-- Create index on id
CREATE INDEX IF NOT EXISTS ix_cv_info_store_id ON cv_info_store(id);

-- Add comment to table
COMMENT ON TABLE cv_info_store IS 'Stores optimized CV information with S3 file paths and metadata extraction status';
