import { useState, useRef, useEffect } from 'react';
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
import { ArrowLeft, Mail, Lock, User, BookOpen, ChevronDown, Shield, RefreshCw } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { UNIVERSITY_EMAIL_DOMAIN, DEPARTMENTS } from '@/constants/university';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { 
    sendVerification, 
    verifyEmail, 
    resendVerification,
    cancelVerification,
    isSendingVerification, 
    isVerifying,
    isResending,
    pendingVerification 
  } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('1');
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);
  
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendVerification = async () => {
    if (!email.trim() || !password.trim() || !displayName.trim() || !department) {
      Alert.alert('エラー', '全ての項目を入力してください');
      return;
    }

    if (password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上で入力してください');
      return;
    }

    try {
      await sendVerification({
        email: email.trim(),
        displayName: displayName.trim(),
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face`,
        department,
        year: parseInt(year, 10),
        hobbies: [],
        courses: [],
        bio: '',
      });
      setCountdown(60);
    } catch (error) {
      Alert.alert('エラー', error instanceof Error ? error.message : '認証コードの送信に失敗しました');
    }
  };

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      const chars = text.split('').slice(0, 6);
      const newCode = [...verificationCode];
      chars.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setVerificationCode(newCode);
      const nextIndex = Math.min(index + chars.length, 5);
      codeInputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...verificationCode];
    newCode[index] = text;
    setVerificationCode(newCode);

    if (text && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      Alert.alert('エラー', '6桁の認証コードを入力してください');
      return;
    }

    try {
      await verifyEmail(code);
      router.replace('/(auth)/setup-profile' as any);
    } catch (error) {
      Alert.alert('認証エラー', error instanceof Error ? error.message : '認証に失敗しました');
      setVerificationCode(['', '', '', '', '', '']);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    try {
      await resendVerification();
      setCountdown(60);
      setVerificationCode(['', '', '', '', '', '']);
    } catch (error) {
      Alert.alert('エラー', error instanceof Error ? error.message : '再送信に失敗しました');
    }
  };

  const handleBack = () => {
    if (pendingVerification) {
      Alert.alert(
        '登録をキャンセル',
        '認証を中断しますか？入力した情報は失われます。',
        [
          { text: 'いいえ', style: 'cancel' },
          { 
            text: 'はい', 
            style: 'destructive',
            onPress: async () => {
              await cancelVerification();
              router.back();
            }
          },
        ]
      );
    } else {
      router.back();
    }
  };

  if (pendingVerification) {
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
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.verificationHeader}>
              <View style={styles.verificationIconContainer}>
                <Shield size={48} color={colors.primary} />
              </View>
              <Text style={styles.title}>メール認証</Text>
              <Text style={styles.verificationSubtitle}>
                以下のメールアドレスに認証コードを送信しました
              </Text>
              <Text style={styles.emailDisplay}>{pendingVerification.email}</Text>
            </View>

            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>6桁の認証コードを入力</Text>
              <View style={styles.codeInputs}>
                {verificationCode.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { codeInputRefs.current[index] = ref; }}
                    style={[
                      styles.codeInput,
                      digit && styles.codeInputFilled,
                    ]}
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={({ nativeEvent }) => handleCodeKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={6}
                    selectTextOnFocus
                    testID={`code-input-${index}`}
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, isVerifying && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={isVerifying}
              testID="verify-button"
            >
              {isVerifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>認証する</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>コードが届きませんか？</Text>
              <TouchableOpacity
                style={[styles.resendButton, (countdown > 0 || isResending) && styles.resendButtonDisabled]}
                onPress={handleResend}
                disabled={countdown > 0 || isResending}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <RefreshCw size={16} color={countdown > 0 ? colors.textMuted : colors.primary} />
                    <Text style={[styles.resendButtonText, countdown > 0 && styles.resendButtonTextDisabled]}>
                      {countdown > 0 ? `再送信 (${countdown}秒)` : '再送信'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                ※ 認証コードの有効期限は10分間です
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>新規登録</Text>
            <Text style={styles.subtitle}>プロフィールを作成しよう</Text>
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
                autoCapitalize="none"
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
                      style={[
                        styles.pickerItem,
                        department === dept && styles.pickerItemSelected,
                      ]}
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
                    <Text
                      style={[styles.yearButtonText, year === y && styles.yearButtonTextSelected]}
                    >
                      {y}年
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isSendingVerification && styles.buttonDisabled]}
              onPress={handleSendVerification}
              disabled={isSendingVerification}
              testID="register-button"
            >
              {isSendingVerification ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>認証コードを送信</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              登録することで利用規約とプライバシーポリシーに同意したものとみなされます
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
  notice: {
    marginTop: 24,
    alignItems: 'center',
  },
  noticeText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  verificationHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  verificationIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.tag,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  verificationSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  emailDisplay: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
    marginTop: 8,
  },
  codeContainer: {
    marginBottom: 32,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  codeInputs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: 24,
    fontWeight: '600' as const,
    textAlign: 'center',
    color: colors.text,
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.tag,
  },
  verifyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 56,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  resendText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  resendButtonTextDisabled: {
    color: colors.textMuted,
  },
});
