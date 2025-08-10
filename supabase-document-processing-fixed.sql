-- Fixed Document Processing and Form Management Schema
-- This script handles existing tables and types properly

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
            "surnames": {"type": "text", "required": true, "validation": "name"},
            "given_names": {"type": "text", "required": true, "validation": "name"},
            "full_name_native_alphabet": {"type": "text", "required": false},
            "other_names_used": {"type": "select", "options": ["Yes", "No"], "required": true},
            "telecode_name": {"type": "select", "options": ["Yes", "No"], "required": true},
            "sex": {"type": "select", "options": ["Male", "Female"], "required": true},
            "marital_status": {"type": "select", "options": ["Single", "Married", "Divorced", "Widowed", "Separated"], "required": true},
            "date_of_birth": {"type": "date", "required": true},
            "place_of_birth_city": {"type": "text", "required": true},
            "place_of_birth_state": {"type": "text", "required": false},
            "place_of_birth_country": {"type": "text", "required": true},
            "nationality": {"type": "text", "required": true},
            "other_nationalities": {"type": "select", "options": ["Yes", "No"], "required": true},
            "other_nationality_country": {"type": "text", "required": false},
            "other_nationality_passport": {"type": "select", "options": ["Yes", "No"], "required": false},
            "permanent_resident_other_country": {"type": "select", "options": ["Yes", "No"], "required": true},
            "permanent_resident_country": {"type": "text", "required": false},
            "national_identification_number": {"type": "text", "required": false},
            "us_social_security_number": {"type": "text", "required": false},
            "us_taxpayer_id_number": {"type": "text", "required": false}
        },
        "travel_info": {
            "purpose_of_trip": {"type": "select", "options": ["Business", "Tourism", "Study", "Work", "Medical Treatment", "Transit", "Other"], "required": true},
            "purpose_specify": {"type": "text", "required": false},
            "specific_travel_plans": {"type": "select", "options": ["Yes", "No"], "required": true},
            "arrival_date": {"type": "date", "required": true},
            "arrival_flight": {"type": "text", "required": false},
            "arrival_city": {"type": "text", "required": false},
            "departure_date": {"type": "date", "required": true},
            "departure_flight": {"type": "text", "required": false},
            "departure_city": {"type": "text", "required": false},
            "visit_locations": {"type": "text", "required": false},
            "us_stay_address_line1": {"type": "text", "required": true},
            "us_stay_address_line2": {"type": "text", "required": false},
            "us_stay_city": {"type": "text", "required": true},
            "us_stay_state": {"type": "text", "required": true},
            "us_stay_zip": {"type": "text", "required": false},
            "length_of_stay": {"type": "text", "required": true},
            "trip_payer": {"type": "text", "required": true}
        },
        "traveling_companions": {
            "traveling_with_others": {"type": "select", "options": ["Yes", "No"], "required": true},
            "traveling_as_group": {"type": "select", "options": ["Yes", "No"], "required": true},
            "group_name": {"type": "text", "required": false},
            "companion_surnames": {"type": "text", "required": false},
            "companion_given_names": {"type": "text", "required": false},
            "companion_relationship": {"type": "text", "required": false}
        },
        "us_history": {
            "been_in_us": {"type": "select", "options": ["Yes", "No"], "required": true},
            "last_visit_date": {"type": "date", "required": false},
            "last_visit_length": {"type": "text", "required": false},
            "us_driver_license": {"type": "select", "options": ["Yes", "No"], "required": true},
            "driver_license_number": {"type": "text", "required": false},
            "driver_license_state": {"type": "text", "required": false},
            "previous_us_visa": {"type": "select", "options": ["Yes", "No"], "required": true},
            "last_visa_issued_date": {"type": "date", "required": false},
            "last_visa_number": {"type": "text", "required": false},
            "same_visa_type": {"type": "select", "options": ["Yes", "No"], "required": false},
            "same_country_application": {"type": "select", "options": ["Yes", "No"], "required": false},
            "ten_printed": {"type": "select", "options": ["Yes", "No"], "required": true},
            "visa_lost_stolen": {"type": "select", "options": ["Yes", "No"], "required": true},
            "visa_lost_year": {"type": "text", "required": false},
            "visa_lost_explanation": {"type": "text", "required": false},
            "visa_cancelled": {"type": "select", "options": ["Yes", "No"], "required": true},
            "visa_cancelled_explanation": {"type": "text", "required": false},
            "visa_refused": {"type": "select", "options": ["Yes", "No"], "required": true},
            "visa_refused_explanation": {"type": "text", "required": false},
            "immigrant_petition": {"type": "select", "options": ["Yes", "No"], "required": true},
            "immigrant_petition_explanation": {"type": "text", "required": false}
        },
        "contact_info": {
            "home_address_line1": {"type": "text", "required": true},
            "home_address_line2": {"type": "text", "required": false},
            "home_city": {"type": "text", "required": true},
            "home_state": {"type": "text", "required": true},
            "home_postal_code": {"type": "text", "required": true},
            "home_country": {"type": "text", "required": true},
            "mailing_same_as_home": {"type": "select", "options": ["Yes", "No"], "required": true},
            "mailing_address_line1": {"type": "text", "required": false},
            "mailing_address_line2": {"type": "text", "required": false},
            "mailing_city": {"type": "text", "required": false},
            "mailing_state": {"type": "text", "required": false},
            "mailing_postal_code": {"type": "text", "required": false},
            "mailing_country": {"type": "text", "required": false},
            "primary_phone": {"type": "tel", "required": true},
            "secondary_phone": {"type": "tel", "required": false},
            "work_phone": {"type": "tel", "required": false},
            "other_phone_numbers": {"type": "select", "options": ["Yes", "No"], "required": true},
            "additional_phone": {"type": "tel", "required": false},
            "email_address": {"type": "email", "required": true},
            "other_email_addresses": {"type": "select", "options": ["Yes", "No"], "required": true},
            "additional_email": {"type": "email", "required": false},
            "social_media_presence": {"type": "select", "options": ["Yes", "No"], "required": true},
            "social_media_platform": {"type": "text", "required": false},
            "social_media_identifier": {"type": "text", "required": false},
            "other_websites": {"type": "select", "options": ["Yes", "No"], "required": true},
            "additional_social_platform": {"type": "text", "required": false},
            "additional_social_handle": {"type": "text", "required": false}
        },
        "passport_info": {
            "passport_type": {"type": "select", "options": ["REGULAR", "OFFICIAL", "DIPLOMATIC", "LAISSEZ-PASSER", "OTHER"], "required": true},
            "passport_number": {"type": "text", "required": true},
            "passport_book_number": {"type": "text", "required": false},
            "passport_issuing_country": {"type": "text", "required": true},
            "passport_issued_city": {"type": "text", "required": true},
            "passport_issued_state": {"type": "text", "required": false},
            "passport_issued_country": {"type": "text", "required": true},
            "passport_issue_date": {"type": "date", "required": true},
            "passport_expiry_date": {"type": "date", "required": true},
            "passport_lost_stolen": {"type": "select", "options": ["Yes", "No"], "required": true},
            "lost_passport_number": {"type": "text", "required": false},
            "lost_passport_country": {"type": "text", "required": false},
            "lost_passport_explanation": {"type": "text", "required": false}
        },
        "us_contact": {
            "contact_surnames": {"type": "text", "required": true},
            "contact_given_names": {"type": "text", "required": true},
            "contact_organization": {"type": "text", "required": false},
            "contact_relationship": {"type": "text", "required": true},
            "contact_address_line1": {"type": "text", "required": true},
            "contact_address_line2": {"type": "text", "required": false},
            "contact_city": {"type": "text", "required": true},
            "contact_state": {"type": "text", "required": true},
            "contact_zip": {"type": "text", "required": false},
            "contact_phone": {"type": "tel", "required": true},
            "contact_email": {"type": "email", "required": false}
        },
        "family_info": {
            "father_surnames": {"type": "text", "required": true},
            "father_given_names": {"type": "text", "required": true},
            "father_date_of_birth": {"type": "date", "required": true},
            "father_in_us": {"type": "select", "options": ["Yes", "No"], "required": true},
            "father_status": {"type": "text", "required": false},
            "mother_surnames": {"type": "text", "required": true},
            "mother_given_names": {"type": "text", "required": true},
            "mother_date_of_birth": {"type": "date", "required": true},
            "mother_in_us": {"type": "select", "options": ["Yes", "No"], "required": true},
            "mother_status": {"type": "text", "required": false},
            "immediate_relatives_us": {"type": "select", "options": ["Yes", "No"], "required": true},
            "other_relatives_us": {"type": "select", "options": ["Yes", "No"], "required": true},
            "relative_surnames": {"type": "text", "required": false},
            "relative_given_names": {"type": "text", "required": false},
            "relative_relationship": {"type": "text", "required": false},
            "relative_status": {"type": "text", "required": false}
        },
        "spouse_info": {
            "spouse_surnames": {"type": "text", "required": false},
            "spouse_given_names": {"type": "text", "required": false},
            "spouse_date_of_birth": {"type": "date", "required": false},
            "spouse_nationality": {"type": "text", "required": false},
            "spouse_place_of_birth_city": {"type": "text", "required": false},
            "spouse_place_of_birth_country": {"type": "text", "required": false},
            "spouse_address": {"type": "text", "required": false}
        },
        "present_work_education": {
            "primary_occupation": {"type": "select", "options": ["AGRICULTURE", "ARTIST/PERFORMER", "BUSINESS", "COMMUNICATIONS", "COMPUTER SCIENCE", "CULINARY/FOOD SERVICES", "EDUCATION", "ENGINEERING", "GOVERNMENT", "HOMEMAKER", "LEGAL PROFESSION", "MEDICAL/HEALTH", "MILITARY", "NATURAL SCIENCE", "NOT EMPLOYED", "PHYSICAL SCIENCES", "RELIGIOUS VOCATION", "RESEARCH", "RETIRED", "SOCIAL SCIENCE", "STUDENT", "OTHER"], "required": true},
            "employer_school_name": {"type": "text", "required": true},
            "employer_address_line1": {"type": "text", "required": true},
            "employer_address_line2": {"type": "text", "required": false},
            "employer_city": {"type": "text", "required": true},
            "employer_state": {"type": "text", "required": true},
            "employer_postal_code": {"type": "text", "required": true},
            "employer_country": {"type": "text", "required": true},
            "employer_phone": {"type": "tel", "required": true},
            "start_date": {"type": "date", "required": true},
            "monthly_income": {"type": "text", "required": false},
            "job_duties": {"type": "text", "required": true}
        },
        "previous_work_education": {
            "previously_employed": {"type": "select", "options": ["Yes", "No"], "required": true},
            "attended_educational_institutions": {"type": "select", "options": ["Yes", "No"], "required": true},
            "previous_employer_name": {"type": "text", "required": false},
            "previous_employer_address_line1": {"type": "text", "required": false},
            "previous_employer_address_line2": {"type": "text", "required": false},
            "previous_employer_city": {"type": "text", "required": false},
            "previous_employer_state": {"type": "text", "required": false},
            "previous_employer_postal_code": {"type": "text", "required": false},
            "previous_employer_country": {"type": "text", "required": false},
            "previous_employer_phone": {"type": "tel", "required": false},
            "previous_job_title": {"type": "text", "required": false},
            "previous_supervisor_surname": {"type": "text", "required": false},
            "previous_supervisor_given_names": {"type": "text", "required": false},
            "previous_employment_from": {"type": "date", "required": false},
            "previous_employment_to": {"type": "date", "required": false},
            "previous_job_duties": {"type": "text", "required": false},
            "educational_institution_name": {"type": "text", "required": false},
            "educational_address_line1": {"type": "text", "required": false},
            "educational_address_line2": {"type": "text", "required": false},
            "educational_city": {"type": "text", "required": false},
            "educational_state": {"type": "text", "required": false},
            "educational_postal_code": {"type": "text", "required": false},
            "educational_country": {"type": "text", "required": false},
            "course_of_study": {"type": "text", "required": false},
            "educational_attendance_from": {"type": "date", "required": false},
            "educational_attendance_to": {"type": "date", "required": false}
        },
        "additional_info": {
            "belong_to_clan_tribe": {"type": "select", "options": ["Yes", "No"], "required": true},
            "clan_tribe_name": {"type": "text", "required": false},
            "languages_spoken": {"type": "text", "required": true},
            "traveled_countries_five_years": {"type": "select", "options": ["Yes", "No"], "required": true},
            "countries_visited": {"type": "text", "required": false},
            "belonged_organizations": {"type": "select", "options": ["Yes", "No"], "required": true},
            "organization_names": {"type": "text", "required": false},
            "specialized_skills": {"type": "select", "options": ["Yes", "No"], "required": true},
            "specialized_skills_explanation": {"type": "text", "required": false},
            "served_military": {"type": "select", "options": ["Yes", "No"], "required": true},
            "military_country": {"type": "text", "required": false},
            "military_branch": {"type": "text", "required": false},
            "military_rank": {"type": "text", "required": false},
            "military_specialty": {"type": "text", "required": false},
            "military_service_from": {"type": "date", "required": false},
            "military_service_to": {"type": "date", "required": false},
            "paramilitary_involvement": {"type": "select", "options": ["Yes", "No"], "required": true},
            "paramilitary_explanation": {"type": "text", "required": false}
        },
        "security_background_1": {
            "communicable_disease": {"type": "select", "options": ["Yes", "No"], "required": true},
            "communicable_disease_explanation": {"type": "text", "required": false},
            "mental_physical_disorder": {"type": "select", "options": ["Yes", "No"], "required": true},
            "mental_physical_disorder_explanation": {"type": "text", "required": false},
            "drug_abuser_addict": {"type": "select", "options": ["Yes", "No"], "required": true},
            "drug_abuser_addict_explanation": {"type": "text", "required": false}
        },
        "security_background_2": {
            "arrested_convicted": {"type": "select", "options": ["Yes", "No"], "required": true},
            "arrested_convicted_explanation": {"type": "text", "required": false},
            "controlled_substances_violation": {"type": "select", "options": ["Yes", "No"], "required": true},
            "controlled_substances_violation_explanation": {"type": "text", "required": false},
            "prostitution_involvement": {"type": "select", "options": ["Yes", "No"], "required": true},
            "prostitution_involvement_explanation": {"type": "text", "required": false},
            "money_laundering": {"type": "select", "options": ["Yes", "No"], "required": true},
            "money_laundering_explanation": {"type": "text", "required": false},
            "human_trafficking": {"type": "select", "options": ["Yes", "No"], "required": true},
            "human_trafficking_explanation": {"type": "text", "required": false},
            "aided_human_trafficking": {"type": "select", "options": ["Yes", "No"], "required": true},
            "aided_human_trafficking_explanation": {"type": "text", "required": false},
            "benefited_human_trafficking": {"type": "select", "options": ["Yes", "No"], "required": true},
            "benefited_human_trafficking_explanation": {"type": "text", "required": false}
        },
        "security_background_3": {
            "espionage_activities": {"type": "select", "options": ["Yes", "No"], "required": true},
            "espionage_activities_explanation": {"type": "text", "required": false},
            "terrorist_activities": {"type": "select", "options": ["Yes", "No"], "required": true},
            "terrorist_activities_explanation": {"type": "text", "required": false},
            "terrorist_financial_support": {"type": "select", "options": ["Yes", "No"], "required": true},
            "terrorist_financial_support_explanation": {"type": "text", "required": false},
            "terrorist_organization_member": {"type": "select", "options": ["Yes", "No"], "required": true},
            "terrorist_organization_member_explanation": {"type": "text", "required": false},
            "terrorist_family_member": {"type": "select", "options": ["Yes", "No"], "required": true},
            "terrorist_family_member_explanation": {"type": "text", "required": false},
            "genocide_participation": {"type": "select", "options": ["Yes", "No"], "required": true},
            "genocide_participation_explanation": {"type": "text", "required": false},
            "torture_participation": {"type": "select", "options": ["Yes", "No"], "required": true},
            "torture_participation_explanation": {"type": "text", "required": false},
            "extrajudicial_killings": {"type": "select", "options": ["Yes", "No"], "required": true},
            "extrajudicial_killings_explanation": {"type": "text", "required": false},
            "child_soldiers": {"type": "select", "options": ["Yes", "No"], "required": true},
            "child_soldiers_explanation": {"type": "text", "required": false},
            "religious_freedom_violations": {"type": "select", "options": ["Yes", "No"], "required": true},
            "religious_freedom_violations_explanation": {"type": "text", "required": false},
            "forced_abortion_sterilization": {"type": "select", "options": ["Yes", "No"], "required": true},
            "forced_abortion_sterilization_explanation": {"type": "text", "required": false},
            "coercive_organ_transplantation": {"type": "select", "options": ["Yes", "No"], "required": true},
            "coercive_organ_transplantation_explanation": {"type": "text", "required": false}
        },
        "security_background_4": {
            "immigration_fraud": {"type": "select", "options": ["Yes", "No"], "required": true},
            "immigration_fraud_explanation": {"type": "text", "required": false},
            "removed_deported": {"type": "select", "options": ["Yes", "No"], "required": true},
            "removed_deported_explanation": {"type": "text", "required": false}
        },
        "security_background_5": {
            "withheld_custody": {"type": "select", "options": ["Yes", "No"], "required": true},
            "withheld_custody_explanation": {"type": "text", "required": false},
            "voted_illegally": {"type": "select", "options": ["Yes", "No"], "required": true},
            "voted_illegally_explanation": {"type": "text", "required": false},
            "renounced_citizenship_tax": {"type": "select", "options": ["Yes", "No"], "required": true},
            "renounced_citizenship_tax_explanation": {"type": "text", "required": false}
        },
        "additional_contacts": {
            "contact1_surnames": {"type": "text", "required": false},
            "contact1_given_names": {"type": "text", "required": false},
            "contact1_address_line1": {"type": "text", "required": false},
            "contact1_address_line2": {"type": "text", "required": false},
            "contact1_city": {"type": "text", "required": false},
            "contact1_state": {"type": "text", "required": false},
            "contact1_postal_code": {"type": "text", "required": false},
            "contact1_country": {"type": "text", "required": false},
            "contact1_phone": {"type": "tel", "required": false},
            "contact1_email": {"type": "email", "required": false},
            "contact2_surnames": {"type": "text", "required": false},
            "contact2_given_names": {"type": "text", "required": false},
            "contact2_address_line1": {"type": "text", "required": false},
            "contact2_address_line2": {"type": "text", "required": false},
            "contact2_city": {"type": "text", "required": false},
            "contact2_state": {"type": "text", "required": false},
            "contact2_postal_code": {"type": "text", "required": false},
            "contact2_country": {"type": "text", "required": false}
        },
        "sevis_info": {
            "sevis_id": {"type": "text", "required": false},
            "program_number": {"type": "text", "required": false},
            "intend_to_study": {"type": "select", "options": ["Yes", "No"], "required": true},
            "school_name": {"type": "text", "required": false},
            "course_of_study_sevis": {"type": "text", "required": false},
            "school_address_line1": {"type": "text", "required": false},
            "school_address_line2": {"type": "text", "required": false},
            "school_city": {"type": "text", "required": false},
            "school_state": {"type": "text", "required": false},
            "school_postal_code": {"type": "text", "required": false}
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
    -- Personal Information
    ('full_name', 'personal_info.surnames', 0.95, true),
    ('first_name', 'personal_info.given_names', 0.95, true),
    ('last_name', 'personal_info.surnames', 0.95, true),
    ('date_of_birth', 'personal_info.date_of_birth', 0.90, true),
    ('place_of_birth', 'personal_info.place_of_birth_city', 0.85, true),
    ('nationality', 'personal_info.nationality', 0.90, true),
    ('gender', 'personal_info.sex', 0.95, true),
    
    -- Passport Information
    ('passport_number', 'passport_info.passport_number', 0.95, true),
    ('passport_issue_date', 'passport_info.passport_issue_date', 0.85, true),
    ('passport_expiry_date', 'passport_info.passport_expiry_date', 0.85, true),
    ('passport_issuing_country', 'passport_info.passport_issuing_country', 0.90, true),
    
    -- Contact Information
    ('email', 'contact_info.email_address', 0.80, true),
    ('phone', 'contact_info.primary_phone', 0.80, true),
    ('address', 'contact_info.home_address_line1', 0.75, true),
    ('city', 'contact_info.home_city', 0.85, true),
    ('state', 'contact_info.home_state', 0.85, true),
    ('country', 'contact_info.home_country', 0.90, true),
    ('postal_code', 'contact_info.home_postal_code', 0.80, true),
    
    -- Travel Information
    ('purpose_of_trip', 'travel_info.purpose_of_trip', 0.70, true),
    ('arrival_date', 'travel_info.arrival_date', 0.75, true),
    ('departure_date', 'travel_info.departure_date', 0.75, true),
    
    -- Employment Information
    ('employer_name', 'present_work_education.employer_school_name', 0.85, false),
    ('job_title', 'present_work_education.primary_occupation', 0.80, false),
    ('salary', 'present_work_education.monthly_income', 0.70, false),
    
    -- Education Information
    ('institution_name', 'present_work_education.employer_school_name', 0.85, false),
    ('degree', 'present_work_education.primary_occupation', 0.80, false),
    ('graduation_date', 'present_work_education.start_date', 0.75, false),
    
    -- Family Information
    ('father_name', 'family_info.father_given_names', 0.70, false),
    ('mother_name', 'family_info.mother_given_names', 0.70, false),
    
    -- Additional fields that can be extracted from various documents
    ('visa_number', 'us_history.last_visa_number', 0.85, false),
    ('visa_type', 'travel_info.purpose_of_trip', 0.70, false),
    ('document_number', 'personal_info.national_identification_number', 0.75, false)
) AS mapping(extracted_field, form_field, confidence, required)
WHERE ft.form_type = 'ds160'
ON CONFLICT (form_template_id, extracted_field_name, form_field_name) DO NOTHING;
