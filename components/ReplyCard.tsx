import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { Reply } from '@/types';
import { useUsers } from '@/hooks/useUsers';

interface ReplyCardProps {
  reply: Reply;
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export default function ReplyCard({ reply }: ReplyCardProps) {
  const router = useRouter();
  const { getUserById } = useUsers();
  
  const author = getUserById(reply.userId);

  if (!author) return null;

  const handleAuthorPress = () => {
    router.push(`/user/${reply.userId}` as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      
      <TouchableOpacity onPress={handleAuthorPress} activeOpacity={0.8}>
        <Image source={{ uri: author.avatarUrl }} style={styles.avatar} />
      </TouchableOpacity>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleAuthorPress} activeOpacity={0.8}>
            <Text style={styles.displayName}>{author.displayName}</Text>
          </TouchableOpacity>
          <Text style={styles.time}>{formatTimeAgo(reply.createdAt)}</Text>
        </View>
        
        <Text style={styles.text}>{reply.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  line: {
    width: 2,
    backgroundColor: colors.borderLight,
    position: 'absolute',
    left: 39,
    top: 0,
    bottom: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: colors.borderLight,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  time: {
    fontSize: 12,
    color: colors.textMuted,
  },
  text: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
