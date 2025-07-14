-- Document Processing and Form Management Schema
-- Run this after the basic setup

-- Drop existing types if they exist (to avoid conflicts)
DROP TYPE IF EXISTS field_category CASCADE;
DROP TYPE IF EXISTS validation_status CASCADE;
DROP TYPE IF EXISTS validation_type CASCADE;
DROP TYPE IF EXISTS form_type CASCADE;
DROP TYPE IF EXISTS submission_status CASCADE;

-- Create additional types for document processing
CREATE TYPE field_category AS ENUM ('personal', 'contact', 'address', 'education', 'employment', 'financial', 'travel', 'identification');
CREATE TYPE validation_status AS ENUM ('pending', 'validated', 'flagged', 'corrected');
CREATE TYPE validation_type AS ENUM ('consistency', 'format', 'completeness', 'cross_document');
CREATE TYPE form_type AS ENUM ('ds160', 'work_visa', 'student_visa', 'family_visa', 'custom');
CREATE TYPE submission_status AS ENUM ('draft', 'review', 'finalized', 'submitted');

-- Extracted data from documents
CREATE TABLE IF NOT EXISTS extracted_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    field_name VARCHAR NOT NULL, -- e.g., 'full_name', 'date_of_birth', 'passport_number'
    field_value TEXT,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    field_category field_category NOT NULL,
    validation_status validation_status DEFAULT 'pending',
    validation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing sessions for tracking
CREATE TABLE IF NOT EXISTS processing_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    status processing_status DEFAULT 'queued',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    processing_logs JSONB,
    ocr_text TEXT, -- Raw OCR text from AWS Textract
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form templates
CREATE TABLE IF NOT EXISTS form_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE, -- e.g., 'DS-160', 'Work Visa Application'
    form_type form_type NOT NULL,
    description TEXT,
    fields JSONB NOT NULL, -- Field definitions and validation rules
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form submissions
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    form_template_id UUID REFERENCES form_templates(id),
    status submission_status DEFAULT 'draft',
    form_data JSONB, -- Pre-filled form data
    extracted_data_summary JSONB, -- Summary of data used for pre-filling
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Field mappings (which extracted data maps to which form fields)
CREATE TABLE IF NOT EXISTS field_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_template_id UUID REFERENCES form_templates(id) ON DELETE CASCADE,
    extracted_field_name VARCHAR NOT NULL,
    form_field_name VARCHAR NOT NULL,
    mapping_confidence DECIMAL(3,2) CHECK (mapping_confidence >= 0 AND mapping_confidence <= 1),
    is_required BOOLEAN DEFAULT false,
    validation_rules JSONB, -- Custom validation rules
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(form_template_id, extracted_field_name, form_field_name)
);

-- Data validation logs
CREATE TABLE IF NOT EXISTS validation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extracted_data_id UUID REFERENCES extracted_data(id) ON DELETE CASCADE,
    validation_type validation_type NOT NULL,
    validation_result validation_status NOT NULL,
    validation_message TEXT,
    suggested_correction TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own extracted data" ON extracted_data;
DROP POLICY IF EXISTS "Users can update own extracted data" ON extracted_data;
DROP POLICY IF EXISTS "Users can insert own extracted data" ON extracted_data;
DROP POLICY IF EXISTS "Users can view own processing sessions" ON processing_sessions;
DROP POLICY IF EXISTS "Users can insert own processing sessions" ON processing_sessions;
DROP POLICY IF EXISTS "Authenticated users can view form templates" ON form_templates;
DROP POLICY IF EXISTS "Users can view own form submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can insert own form submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can update own form submissions" ON form_submissions;
DROP POLICY IF EXISTS "Authenticated users can view field mappings" ON field_mappings;
DROP POLICY IF EXISTS "Users can view own validation logs" ON validation_logs;

-- RLS Policies for extracted_data
CREATE POLICY "Users can view own extracted data" ON extracted_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = extracted_data.document_id 
            AND documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own extracted data" ON extracted_data
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = extracted_data.document_id 
            AND documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own extracted data" ON extracted_data
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = extracted_data.document_id 
            AND documents.user_id = auth.uid()
        )
    );

-- RLS Policies for processing_sessions
CREATE POLICY "Users can view own processing sessions" ON processing_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = processing_sessions.document_id 
            AND documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own processing sessions" ON processing_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = processing_sessions.document_id 
            AND documents.user_id = auth.uid()
        )
    );

-- RLS Policies for form_templates (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view form templates" ON form_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for form_submissions
CREATE POLICY "Users can view own form submissions" ON form_submissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own form submissions" ON form_submissions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own form submissions" ON form_submissions
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for field_mappings (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view field mappings" ON field_mappings
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for validation_logs
CREATE POLICY "Users can view own validation logs" ON validation_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM extracted_data 
            JOIN documents ON documents.id = extracted_data.document_id
            WHERE extracted_data.id = validation_logs.extracted_data_id 
            AND documents.user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_extracted_data_document_id ON extracted_data(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_data_field_name ON extracted_data(field_name);
CREATE INDEX IF NOT EXISTS idx_extracted_data_category ON extracted_data(field_category);
CREATE INDEX IF NOT EXISTS idx_processing_sessions_document_id ON processing_sessions(document_id);
CREATE INDEX IF NOT EXISTS idx_processing_sessions_status ON processing_sessions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_id ON form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_field_mappings_template_id ON field_mappings(form_template_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_extracted_data_id ON validation_logs(extracted_data_id);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS handle_extracted_data_updated_at ON extracted_data;
DROP TRIGGER IF EXISTS handle_processing_sessions_updated_at ON processing_sessions;
DROP TRIGGER IF EXISTS handle_form_templates_updated_at ON form_templates;
DROP TRIGGER IF EXISTS handle_form_submissions_updated_at ON form_submissions;

-- Create triggers for updated_at timestamps
CREATE TRIGGER handle_extracted_data_updated_at
    BEFORE UPDATE ON extracted_data
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_processing_sessions_updated_at
    BEFORE UPDATE ON processing_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_form_templates_updated_at
    BEFORE UPDATE ON form_templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_form_submissions_updated_at
    BEFORE UPDATE ON form_submissions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT ALL ON extracted_data TO authenticated;
GRANT ALL ON processing_sessions TO authenticated;
GRANT ALL ON form_templates TO authenticated;
GRANT ALL ON form_submissions TO authenticated;
GRANT ALL ON field_mappings TO authenticated;
GRANT ALL ON validation_logs TO authenticated;

-- Insert sample form templates (only if they don't exist)
INSERT INTO form_templates (name, form_type, description, fields) VALUES
(
    'DS-160 Nonimmigrant Visa Application',
    'ds160',
    'Standard US nonimmigrant visa application form',
    '{
        "personal_info": {
            "full_name": {"type": "text", "required": true, "validation": "name"},
            "date_of_birth": {"type": "date", "required": true},
            "place_of_birth": {"type": "text", "required": true},
            "nationality": {"type": "text", "required": true},
            "gender": {"type": "select", "options": ["Male", "Female"], "required": true}
        },
        "contact_info": {
            "email": {"type": "email", "required": true},
            "phone": {"type": "tel", "required": true},
            "address": {"type": "text", "required": true},
            "city": {"type": "text", "required": true},
            "country": {"type": "text", "required": true}
        },
        "passport_info": {
            "passport_number": {"type": "text", "required": true},
            "passport_issue_date": {"type": "date", "required": true},
            "passport_expiry_date": {"type": "date", "required": true},
            "passport_issuing_country": {"type": "text", "required": true}
        },
        "travel_info": {
            "purpose_of_trip": {"type": "select", "options": ["Business", "Tourism", "Study", "Work"], "required": true},
            "intended_arrival_date": {"type": "date", "required": true},
            "intended_departure_date": {"type": "date", "required": true}
        }
    }'
),
(
    'Work Visa Application',
    'work_visa',
    'Work visa application form',
    '{
        "personal_info": {
            "full_name": {"type": "text", "required": true},
            "date_of_birth": {"type": "date", "required": true},
            "nationality": {"type": "text", "required": true}
        },
        "employment_info": {
            "employer_name": {"type": "text", "required": true},
            "job_title": {"type": "text", "required": true},
            "salary": {"type": "number", "required": true},
            "employment_start_date": {"type": "date", "required": true}
        },
        "education_info": {
            "highest_education": {"type": "text", "required": true},
            "institution_name": {"type": "text", "required": true},
            "graduation_date": {"type": "date", "required": true}
        }
    }'
)
ON CONFLICT (name) DO NOTHING;

-- Insert sample field mappings for DS-160 (only if they don't exist)
INSERT INTO field_mappings (form_template_id, extracted_field_name, form_field_name, mapping_confidence, is_required) 
SELECT 
    ft.id,
    mapping.extracted_field,
    mapping.form_field,
    mapping.confidence,
    mapping.required
FROM form_templates ft,
(VALUES 
    ('full_name', 'personal_info.full_name', 0.95, true),
    ('date_of_birth', 'personal_info.date_of_birth', 0.90, true),
    ('place_of_birth', 'personal_info.place_of_birth', 0.85, true),
    ('nationality', 'personal_info.nationality', 0.90, true),
    ('passport_number', 'passport_info.passport_number', 0.95, true),
    ('passport_issue_date', 'passport_info.passport_issue_date', 0.85, true),
    ('passport_expiry_date', 'passport_info.passport_expiry_date', 0.85, true),
    ('email', 'contact_info.email', 0.80, true),
    ('phone', 'contact_info.phone', 0.80, true),
    ('address', 'contact_info.address', 0.75, false)
) AS mapping(extracted_field, form_field, confidence, required)
WHERE ft.form_type = 'ds160'
ON CONFLICT (form_template_id, extracted_field_name, form_field_name) DO NOTHING; 