-- Create role enum
CREATE TYPE app_role AS ENUM ('doctor', 'secretary');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  address TEXT,
  blood_type TEXT,
  allergies TEXT[],
  chronic_diseases TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create visits table
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  chief_complaint TEXT NOT NULL,
  symptoms TEXT,
  diagnosis TEXT,
  treatment TEXT,
  prescriptions TEXT,
  lab_tests TEXT,
  follow_up_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  purpose TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create security definer function to check if user has any medical role
CREATE OR REPLACE FUNCTION public.is_medical_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('doctor', 'secretary')
  )
$$;

-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_medical_staff(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- User Roles RLS Policies
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_medical_staff(auth.uid()));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Patients RLS Policies
CREATE POLICY "Medical staff can view all patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (public.is_medical_staff(auth.uid()));

CREATE POLICY "Medical staff can create patients"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (public.is_medical_staff(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Medical staff can update patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (public.is_medical_staff(auth.uid()));

CREATE POLICY "Medical staff can delete patients"
  ON public.patients FOR DELETE
  TO authenticated
  USING (public.is_medical_staff(auth.uid()));

-- Visits RLS Policies
CREATE POLICY "Medical staff can view all visits"
  ON public.visits FOR SELECT
  TO authenticated
  USING (public.is_medical_staff(auth.uid()));

CREATE POLICY "Medical staff can create visits"
  ON public.visits FOR INSERT
  TO authenticated
  WITH CHECK (public.is_medical_staff(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Medical staff can update visits"
  ON public.visits FOR UPDATE
  TO authenticated
  USING (public.is_medical_staff(auth.uid()));

CREATE POLICY "Medical staff can delete visits"
  ON public.visits FOR DELETE
  TO authenticated
  USING (public.is_medical_staff(auth.uid()));

-- Appointments RLS Policies
CREATE POLICY "Medical staff can view all appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (public.is_medical_staff(auth.uid()));

CREATE POLICY "Medical staff can create appointments"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_medical_staff(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Medical staff can update appointments"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (public.is_medical_staff(auth.uid()));

CREATE POLICY "Medical staff can delete appointments"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (public.is_medical_staff(auth.uid()));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for patient files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-files',
  'patient-files',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies for patient files
CREATE POLICY "Medical staff can view patient files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'patient-files' AND public.is_medical_staff(auth.uid()));

CREATE POLICY "Medical staff can upload patient files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'patient-files' AND public.is_medical_staff(auth.uid()));

CREATE POLICY "Medical staff can update patient files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'patient-files' AND public.is_medical_staff(auth.uid()));

CREATE POLICY "Medical staff can delete patient files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'patient-files' AND public.is_medical_staff(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_patients_phone ON public.patients(phone);
CREATE INDEX idx_patients_created_by ON public.patients(created_by);
CREATE INDEX idx_visits_patient_id ON public.visits(patient_id);
CREATE INDEX idx_visits_visit_date ON public.visits(visit_date);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);