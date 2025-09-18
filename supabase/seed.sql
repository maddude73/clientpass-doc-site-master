-- Consolidated DDL for ClientPass DocumentHub

-- Function to update timestamps (if not already exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create docs_users table for documentation site access
CREATE TABLE IF NOT EXISTS public.docs_users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for docs_users
ALTER TABLE public.docs_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for docs_users
CREATE POLICY "Doc users can view their own profile" ON public.docs_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Doc users can update their own profile" ON public.docs_users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Doc users can insert their own profile" ON public.docs_users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create trigger for docs_users updated_at
CREATE TRIGGER update_docs_users_updated_at
  BEFORE UPDATE ON public.docs_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create docs_invites table for invitation-only access
CREATE TABLE IF NOT EXISTS public.docs_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16),'hex'),
  invitee_email TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES public.docs_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS for docs_invites
ALTER TABLE public.docs_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for docs_invites
CREATE POLICY "Users can view invites they sent" ON public.docs_invites
  FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Public can view a pending invite with a token" ON public.docs_invites
  FOR SELECT USING (status = 'pending');

--Seed data for admin users
INSERT INTO public.docs_users (id, full_name, email, role)
VALUES
  ('07eef55e-d3e2-40a3-907e-31b80550178e', 'Admin User One', 'admin1@example.com', 'admin'),
  ('f7952139-2c41-4342-9949-00856f48d362', 'Admin User Two', 'admin2@example.com', 'admin'),
  ('306561c6-b13b-4356-9e2a-a06fac9aa2d6', 'Admin User Three', 'admin3@example.com', 'admin')
ON CONFLICT (id) DO NOTHING;
