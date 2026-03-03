import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from '@/types';
import { UNIVERSITY_EMAIL_DOMAIN } from '@/constants/university';
import { supabase } from '@/lib/supabase';

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  department: string | null;
  year: number | null;
  hobbies: string[] | null;
  courses: string[] | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
  department: string;
  year: number;
};

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face';

const mapProfileToUser = (profile: ProfileRow, email: string): User => ({
  id: profile.id,
  email,
  displayName: profile.display_name,
  avatarUrl: profile.avatar_url ?? DEFAULT_AVATAR,
  department: profile.department ?? '',
  year: profile.year ?? 1,
  hobbies: profile.hobbies ?? [],
  courses: profile.courses ?? [],
  bio: profile.bio ?? '',
  createdAt: profile.created_at,
  profileCompleted: false,
  emailVerified: true,
});

const ensureProfile = async (authUser: { id: string; email?: string | null; user_metadata?: any }) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle<ProfileRow>();

  if (error) throw error;
  if (data) return data;

  const fallbackDisplayName =
    (authUser.user_metadata?.display_name as string | undefined) ??
    (authUser.email ? authUser.email.split('@')[0] : 'ユーザー');

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: authUser.id,
      display_name: fallbackDisplayName,
      avatar_url: authUser.user_metadata?.avatar_url ?? DEFAULT_AVATAR,
      department: '',
      year: 1,
      hobbies: [],
      courses: [],
      bio: '',
    })
    .select('*')
    .single<ProfileRow>();

  if (insertError) throw insertError;
  return inserted;
};

export const validateUniversityEmail = (email: string): boolean => {
  return email.toLowerCase().endsWith(UNIVERSITY_EMAIL_DOMAIN);
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncUserFromSession = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;

    if (!session?.user) {
      setUser(null);
      return;
    }

    const profile = await ensureProfile(session.user);
    setUser(mapProfileToUser(profile, session.user.email ?? ''));
  }, []);

  useEffect(() => {
    let mounted = true;

    syncUserFromSession()
      .catch((error) => {
        console.log('Failed to sync session:', error);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      syncUserFromSession().catch((error) => {
        console.log('Auth state sync failed:', error);
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncUserFromSession]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      if (!validateUniversityEmail(email)) {
        throw new Error('関西学院大学のメールアドレス（@kwansei.ac.jp）を使用してください');
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('ログインに失敗しました');

      const profile = await ensureProfile(data.user);
      return mapProfileToUser(profile, data.user.email ?? email);
    },
    onSuccess: (nextUser) => {
      setUser(nextUser);
      queryClient.invalidateQueries();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, displayName, department, year }: RegisterInput) => {
      if (!validateUniversityEmail(email)) {
        throw new Error('関西学院大学のメールアドレス（@kwansei.ac.jp）を使用してください');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            department,
            year,
            avatar_url: DEFAULT_AVATAR,
          },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('登録に失敗しました');

      if (!data.session) {
        return { user: null as User | null, emailConfirmationRequired: true };
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: displayName,
        avatar_url: DEFAULT_AVATAR,
        department,
        year,
        hobbies: [],
        courses: [],
        bio: '',
      });
      if (profileError) throw profileError;

      const profile = await ensureProfile(data.user);
      return {
        user: mapProfileToUser(profile, data.user.email ?? email),
        emailConfirmationRequired: false,
      };
    },
    onSuccess: (result) => {
      setUser(result.user);
      queryClient.invalidateQueries();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!user) throw new Error('ログインが必要です');

      const payload: Record<string, unknown> = {};
      if (updates.displayName !== undefined) payload.display_name = updates.displayName;
      if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
      if (updates.department !== undefined) payload.department = updates.department;
      if (updates.year !== undefined) payload.year = updates.year;
      if (updates.hobbies !== undefined) payload.hobbies = updates.hobbies;
      if (updates.courses !== undefined) payload.courses = updates.courses;
      if (updates.bio !== undefined) payload.bio = updates.bio;

      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id)
        .select('*')
        .single<ProfileRow>();
      if (error) throw error;

      return mapProfileToUser(data, user.email);
    },
    onSuccess: (nextUser) => {
      setUser(nextUser);
      queryClient.invalidateQueries();
    },
  });

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    queryClient.invalidateQueries();
  }, [queryClient]);

  const needsProfileSetup = useMemo(() => {
    if (!user) return false;
    return (
      user.displayName.trim().length === 0 ||
      user.department.trim().length === 0 ||
      user.hobbies.length === 0 ||
      user.courses.length === 0
    );
  }, [user]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    logout,
    loginError: loginMutation.error?.message,
    registerError: registerMutation.error?.message,
    isLoginLoading: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    needsProfileSetup,
  };
});
