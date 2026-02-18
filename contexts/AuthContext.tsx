import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { User } from '@/types';
import { UNIVERSITY_EMAIL_DOMAIN } from '@/constants/university';
import { mockUsers } from '@/mocks/users';

const AUTH_STORAGE_KEY = 'auth_user';
const VERIFICATION_STORAGE_KEY = 'pending_verification';

interface PendingVerification {
  email: string;
  code: string;
  userData: Omit<User, 'id' | 'createdAt'>;
  expiresAt: number;
}

const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const validateUniversityEmail = (email: string): boolean => {
  return email.toLowerCase().endsWith(UNIVERSITY_EMAIL_DOMAIN);
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);
  const verificationCodeRef = useRef<string | null>(null);

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) as User : null;
    },
  });

  useEffect(() => {
    if (authQuery.data !== undefined) {
      setUser(authQuery.data);
      setIsLoading(false);
    }
  }, [authQuery.data]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      if (!validateUniversityEmail(email)) {
        throw new Error('関西学院大学のメールアドレス（@kwansei.ac.jp）を使用してください');
      }
      
      const existingUser = mockUsers.find(u => u.email === email);
      if (!existingUser) {
        throw new Error('アカウントが見つかりません');
      }
      
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(existingUser));
      return existingUser;
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const sendVerificationMutation = useMutation({
    mutationFn: async (userData: Omit<User, 'id' | 'createdAt'>) => {
      if (!validateUniversityEmail(userData.email)) {
        throw new Error('関西学院大学のメールアドレス（@kwansei.ac.jp）を使用してください');
      }
      
      const code = generateVerificationCode();
      verificationCodeRef.current = code;
      
      const verification: PendingVerification = {
        email: userData.email,
        code,
        userData,
        expiresAt: Date.now() + 10 * 60 * 1000,
      };
      
      await AsyncStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(verification));
      
      console.log(`[EMAIL VERIFICATION] Code for ${userData.email}: ${code}`);
      
      if (Platform.OS === 'web') {
        setTimeout(() => {
          alert(`認証コード: ${code}\n\n※デモ用：実際のアプリではメールで送信されます`);
        }, 500);
      } else {
        setTimeout(() => {
          Alert.alert(
            'メール認証',
            `認証コードを送信しました\n\n【デモ用】認証コード: ${code}\n\n※実際のアプリではメールで送信されます`,
            [{ text: 'OK' }]
          );
        }, 500);
      }
      
      return verification;
    },
    onSuccess: (data) => {
      setPendingVerification(data);
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (inputCode: string) => {
      const storedData = await AsyncStorage.getItem(VERIFICATION_STORAGE_KEY);
      if (!storedData) {
        throw new Error('認証セッションが見つかりません。もう一度登録してください');
      }
      
      const verification: PendingVerification = JSON.parse(storedData);
      
      if (Date.now() > verification.expiresAt) {
        await AsyncStorage.removeItem(VERIFICATION_STORAGE_KEY);
        throw new Error('認証コードの有効期限が切れました。もう一度登録してください');
      }
      
      if (verification.code !== inputCode) {
        throw new Error('認証コードが正しくありません');
      }
      
      const newUser: User = {
        ...verification.userData,
        id: `user-${Date.now()}`,
        createdAt: new Date().toISOString(),
        profileCompleted: false,
        emailVerified: true,
      };
      
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      await AsyncStorage.removeItem(VERIFICATION_STORAGE_KEY);
      
      return newUser;
    },
    onSuccess: (data) => {
      setUser(data);
      setPendingVerification(null);
      verificationCodeRef.current = null;
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      if (!pendingVerification) {
        throw new Error('保留中の認証がありません');
      }
      
      const code = generateVerificationCode();
      verificationCodeRef.current = code;
      
      const newVerification: PendingVerification = {
        ...pendingVerification,
        code,
        expiresAt: Date.now() + 10 * 60 * 1000,
      };
      
      await AsyncStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(newVerification));
      
      console.log(`[EMAIL VERIFICATION] Resent code for ${pendingVerification.email}: ${code}`);
      
      if (Platform.OS === 'web') {
        alert(`新しい認証コード: ${code}\n\n※デモ用：実際のアプリではメールで送信されます`);
      } else {
        Alert.alert(
          'コード再送信',
          `新しい認証コードを送信しました\n\n【デモ用】認証コード: ${code}`,
          [{ text: 'OK' }]
        );
      }
      
      return newVerification;
    },
    onSuccess: (data) => {
      setPendingVerification(data);
    },
  });

  const cancelVerification = useCallback(async () => {
    await AsyncStorage.removeItem(VERIFICATION_STORAGE_KEY);
    setPendingVerification(null);
    verificationCodeRef.current = null;
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!user) throw new Error('ログインが必要です');
      
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    queryClient.invalidateQueries({ queryKey: ['auth'] });
  }, [queryClient]);

  const isProfileComplete = (u: User | null): boolean => {
    if (!u) return false;
    return u.profileCompleted === true && 
      u.displayName.trim().length > 0 && 
      u.hobbies.length > 0 && 
      u.courses.length > 0;
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading || authQuery.isLoading,
    login: loginMutation.mutateAsync,
    sendVerification: sendVerificationMutation.mutateAsync,
    verifyEmail: verifyEmailMutation.mutateAsync,
    resendVerification: resendVerificationMutation.mutateAsync,
    cancelVerification,
    updateProfile: updateProfileMutation.mutateAsync,
    logout,
    loginError: loginMutation.error?.message,
    verificationError: sendVerificationMutation.error?.message || verifyEmailMutation.error?.message,
    isLoginLoading: loginMutation.isPending,
    isSendingVerification: sendVerificationMutation.isPending,
    isVerifying: verifyEmailMutation.isPending,
    isResending: resendVerificationMutation.isPending,
    pendingVerification,
    needsProfileSetup: user ? !isProfileComplete(user) : false,
  };
});
