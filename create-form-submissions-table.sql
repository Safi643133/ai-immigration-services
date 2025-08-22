-- Create table for DS-160 form submissions
CREATE TABLE IF NOT EXISTS ceac_form_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    form_template_id UUID REFERENCES form_templates(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'processing', 'completed', 'failed')),
    application_id TEXT,
    confirmation_id TEXT,
    embassy TEXT,
    ceac_version TEXT DEFAULT 'latest',
    extracted_data_summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_id ON ceac_form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON ceac_form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON ceac_form_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_application_id ON ceac_form_submissions(application_id);

-- Add RLS policies
ALTER TABLE ceac_form_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own form submissions
CREATE POLICY "Users can view own form submissions" ON ceac_form_submissions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own form submissions
CREATE POLICY "Users can insert own form submissions" ON ceac_form_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own form submissions
CREATE POLICY "Users can update own form submissions" ON ceac_form_submissions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own form submissions (soft delete)
CREATE POLICY "Users can delete own form submissions" ON ceac_form_submissions
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_form_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_form_submissions_updated_at
    BEFORE UPDATE ON ceac_form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_form_submissions_updated_at();
