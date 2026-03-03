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
import { ArrowLeft, Mail, Lock, User, BookOpen, ChevronDown } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { UNIVERSITY_EMAIL_DOMAIN, DEPARTMENTS } from '@/constants/university';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isRegistering } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('1');
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !displayName.trim() || !department) {
      Alert.alert('エラー', '全ての項目を入力してください');
      return;
    }
    if (password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上で入力してください');
      return;
    }

    try {
      const result = await register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        department,
        year: parseInt(year, 10),
      });

      if (result.emailConfirmationRequired) {
        Alert.alert('確認メールを送信しました', 'メール確認後にログインしてください。');
        router.replace('/(auth)/login' as any);
        return;
      }

      router.replace('/(auth)/setup-profile' as any);
    } catch (error) {
      Alert.alert('登録エラー', error instanceof Error ? error.message : '登録に失敗しました');
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>新規登録</Text>
            <Text style={styles.subtitle}>Supabase にアカウントを作成します</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <User size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="表示名"
                placeholderTextColor={colors.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
                testID="name-input"
              />
            </View>

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
                placeholder="パスワード（6文字以上）"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
                testID="password-input"
              />
            </View>

            <TouchableOpacity
              style={styles.selectContainer}
              onPress={() => setShowDepartmentPicker(!showDepartmentPicker)}
            >
              <BookOpen size={20} color={colors.textMuted} style={styles.inputIcon} />
              <Text style={[styles.selectText, !department && styles.placeholder]}>
                {department || '学部を選択'}
              </Text>
              <ChevronDown size={20} color={colors.textMuted} />
            </TouchableOpacity>

            {showDepartmentPicker && (
              <View style={styles.pickerContainer}>
                <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                  {DEPARTMENTS.map((dept) => (
                    <TouchableOpacity
                      key={dept}
                      style={[styles.pickerItem, department === dept && styles.pickerItemSelected]}
                      onPress={() => {
                        setDepartment(dept);
                        setShowDepartmentPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          department === dept && styles.pickerItemTextSelected,
                        ]}
                      >
                        {dept}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.yearContainer}>
              <Text style={styles.yearLabel}>学年</Text>
              <View style={styles.yearButtons}>
                {['1', '2', '3', '4'].map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.yearButton, year === y && styles.yearButtonSelected]}
                    onPress={() => setYear(y)}
                  >
                    <Text style={[styles.yearButtonText, year === y && styles.yearButtonTextSelected]}>
                      {y}年
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isRegistering && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isRegistering}
              testID="register-button"
            >
              {isRegistering ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>登録する</Text>
              )}
            </TouchableOpacity>
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
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    marginBottom: 16,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
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
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 56,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  placeholder: {
    color: colors.textMuted,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 200,
    overflow: 'hidden',
  },
  pickerScroll: {
    padding: 8,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pickerItemSelected: {
    backgroundColor: colors.tag,
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerItemTextSelected: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  yearContainer: {
    gap: 12,
  },
  yearLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  yearButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  yearButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
  },
  yearButtonTextSelected: {
    color: '#fff',
  },
  registerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 56,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
});
