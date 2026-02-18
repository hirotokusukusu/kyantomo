import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GraduationCap, Mail, Lock, ArrowRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { UNIVERSITY_EMAIL_DOMAIN } from '@/constants/university';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoginLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    try {
      await login({ email: email.trim(), password });
      router.replace('/(tabs)' as any);
    } catch (error) {
      Alert.alert('ログインエラー', error instanceof Error ? error.message : 'ログインに失敗しました');
    }
  };

  const handleDemoLogin = async () => {
    try {
      await login({ email: 'tanaka@kwansei.ac.jp', password: 'demo' });
      router.replace('/(tabs)' as any);
    } catch (error) {
      Alert.alert('エラー', 'デモログインに失敗しました');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <GraduationCap size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>CampusConnect</Text>
            <Text style={styles.subtitle}>大学の仲間と繋がろう</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={`メールアドレス（${UNIVERSITY_EMAIL_DOMAIN}）`}
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                testID="email-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="パスワード"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                testID="password-input"
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoginLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoginLoading}
              testID="login-button"
            >
              {isLoginLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>ログイン</Text>
                  <ArrowRight size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoLogin}
              disabled={isLoginLoading}
            >
              <Text style={styles.demoButtonText}>デモアカウントでログイン</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>アカウントをお持ちでない方</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
              <Text style={styles.registerLink}>新規登録</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              ※ 大学メール（{UNIVERSITY_EMAIL_DOMAIN}）でのみ登録可能です
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.tag,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: colors.text,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 56,
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  demoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHover,
    borderRadius: 16,
    height: 48,
  },
  demoButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  notice: {
    marginTop: 24,
    alignItems: 'center',
  },
  noticeText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
