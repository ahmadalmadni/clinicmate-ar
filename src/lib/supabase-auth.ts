import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export type UserRole = 'doctor' | 'secretary';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole | null;
}

export const signUp = async (
  email: string,
  password: string,
  fullName: string,
  phone: string,
  role: UserRole
) => {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName,
        phone: phone,
      },
    },
  });

  if (error) return { error };
  if (!data.user) return { error: new Error('فشل إنشاء الحساب') };

  // Add role after user is created
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({ user_id: data.user.id, role });

  if (roleError) {
    console.error('Role assignment error:', roleError);
    return { error: new Error('فشل تعيين الدور') };
  }

  return { data, error: null };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.role as UserRole;
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return { data, error };
};
