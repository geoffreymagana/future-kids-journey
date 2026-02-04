-- Future Kids Journey Database Schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text CHECK (role IN ('admin', 'super_admin')) DEFAULT 'admin',
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Form submissions (leads)
CREATE TABLE IF NOT EXISTS form_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_name text NOT NULL,
  whatsapp_number text NOT NULL,
  status text CHECK (status IN ('new', 'contacted', 'interested', 'enrolled', 'not_interested')) DEFAULT 'new',
  referral_source text,
  referred_by uuid REFERENCES form_submissions(id),
  visit_code text UNIQUE,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id uuid NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
  enrollment_amount numeric(10, 2) NOT NULL,
  signup_commission numeric(10, 2),
  attendance_commission numeric(10, 2),
  status text CHECK (status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Attendance tracking
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  qr_code text NOT NULL UNIQUE,
  status text CHECK (status IN ('scanned', 'attended', 'marked_absent', 'excused')) DEFAULT 'scanned',
  attended_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Payment terms configuration
CREATE TABLE IF NOT EXISTS payment_terms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  signup_commission_rate numeric(5, 2) NOT NULL DEFAULT 10.00,
  attendance_commission_rate numeric(5, 2) NOT NULL DEFAULT 2.50,
  updated_by uuid REFERENCES admins(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Activity logs for auditing
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id uuid NOT NULL REFERENCES admins(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  changes jsonb,
  ip_address text,
  created_at timestamp DEFAULT now()
);

-- Share metrics tracking
CREATE TABLE IF NOT EXISTS share_metrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id uuid NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
  click_platform text,
  click_timestamp timestamp,
  click_ip text,
  intent_platform text,
  intent_timestamp timestamp,
  visit_code text,
  visit_timestamp timestamp,
  visit_ip text,
  created_at timestamp DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_created ON form_submissions(created_at);
CREATE INDEX idx_enrollments_submission ON enrollments(submission_id);
CREATE INDEX idx_enrollments_created ON enrollments(created_at);
CREATE INDEX idx_attendance_enrollment ON attendance(enrollment_id);
CREATE INDEX idx_attendance_qr_code ON attendance(qr_code);
CREATE INDEX idx_activity_logs_admin ON activity_logs(admin_id);
CREATE INDEX idx_share_metrics_submission ON share_metrics(submission_id);

-- Create views for common queries
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM form_submissions) as total_submissions,
  (SELECT COUNT(*) FROM enrollments WHERE status = 'active') as active_enrollments,
  (SELECT COUNT(*) FROM attendance WHERE status = 'attended') as total_attended,
  (SELECT COALESCE(SUM(enrollment_amount), 0) FROM enrollments) as total_revenue;

CREATE OR REPLACE VIEW revenue_metrics AS
SELECT 
  'signup' as commission_type,
  COUNT(*) as transaction_count,
  COALESCE(SUM(enrollment_amount), 0) as total_revenue,
  COALESCE(SUM(signup_commission), 0) as total_commission
FROM enrollments
WHERE signup_commission IS NOT NULL

UNION ALL

SELECT 
  'attendance' as commission_type,
  COUNT(*) as transaction_count,
  COALESCE(SUM(enrollment_amount), 0) as total_revenue,
  COALESCE(SUM(attendance_commission), 0) as total_commission
FROM enrollments
WHERE attendance_commission IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_metrics ENABLE ROW LEVEL SECURITY;

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_submissions_updated_at BEFORE UPDATE ON form_submissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_terms_updated_at BEFORE UPDATE ON payment_terms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
