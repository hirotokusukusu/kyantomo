import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { User } from '@/types';

interface UserCardProps {
  user: User;
}

export default function UserCard({ user }: UserCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/user/${user.id}` as any);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      testID="user-card"
    >
      <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
      
      <View style={styles.content}>
        <Text style={styles.displayName}>{user.displayName}</Text>
        <Text style={styles.meta}>
          {user.department} · {user.year}年
        </Text>
        
        {user.hobbies.length > 0 && (
          <View style={styles.hobbies}>
            {user.hobbies.slice(0, 3).map((hobby, index) => (
              <View key={index} style={styles.hobbyTag}>
                <Text style={styles.hobbyText}>{hobby}</Text>
              </View>
            ))}
            {user.hobbies.length > 3 && (
              <Text style={styles.moreText}>+{user.hobbies.length - 3}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    backgroundColor: colors.borderLight,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  hobbies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  hobbyTag: {
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  hobbyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  moreText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
