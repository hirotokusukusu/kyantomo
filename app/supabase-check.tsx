import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';
import { checkSupabaseConnection } from '@/lib/supabase';

type Status = {
  ok: boolean | null;
  status: number | null;
  message: string;
};

export default function SupabaseCheckScreen() {
  const [status, setStatus] = useState<Status>({
    ok: null,
    status: null,
    message: '未チェック',
  });
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    setLoading(true);
    const result = await checkSupabaseConnection();
    setStatus({
      ok: result.ok,
      status: result.status,
      message: result.message,
    });
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase 接続確認</Text>
      <Text style={styles.subtitle}>API疎通をシンプルに確認します</Text>

      <View style={styles.card}>
        <Text style={styles.label}>ステータス</Text>
        <Text style={[styles.value, status.ok === true && styles.valueOk, status.ok === false && styles.valueNg]}>
          {status.message}
        </Text>
        <Text style={styles.detail}>HTTP: {status.status ?? '--'}</Text>

        <TouchableOpacity style={styles.button} onPress={handleCheck} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>接続を確認</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textMuted,
  },
  card: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  value: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  valueOk: {
    color: colors.success,
  },
  valueNg: {
    color: colors.error,
  },
  detail: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textMuted,
  },
  button: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
