-- Create admin users table with role management
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- No direct access to admin_users table from client (managed via edge function)
CREATE POLICY "No direct access to admin_users"
  ON public.admin_users
  FOR ALL
  USING (false);

-- Create function to verify admin password (security definer)
CREATE OR REPLACE FUNCTION public.verify_admin_login(admin_email TEXT, admin_password TEXT)
RETURNS TABLE(id UUID, email TEXT, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email, au.name
  FROM public.admin_users au
  WHERE au.email = admin_email
    AND au.password_hash = crypt(admin_password, au.password_hash);
END;
$$;

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert default admin user (password: admin123 - should be changed!)
INSERT INTO public.admin_users (email, password_hash, name)
VALUES ('admin@futurekids.com', crypt('admin123', gen_salt('bf')), 'Admin User');