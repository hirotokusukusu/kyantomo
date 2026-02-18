import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Post, User } from '@/types';
import { useUsers } from '@/hooks/useUsers';
import { usePosts } from '@/contexts/PostsContext';
import { useAuth } from '@/contexts/AuthContext';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
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

export default function PostCard({ post, onPress }: PostCardProps) {
  const router = useRouter();
  const { getUserById } = useUsers();
  const { toggleLike } = usePosts();
  const { user: currentUser } = useAuth();
  
  const author = getUserById(post.userId);
  const hasLiked = currentUser ? post.likes.includes(currentUser.id) : false;

  if (!author) return null;

  const handleLike = () => {
    if (currentUser) {
      toggleLike({ postId: post.id, userId: currentUser.id });
    }
  };

  const handleAuthorPress = () => {
    router.push(`/user/${post.userId}` as any);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      testID="post-card"
    >
      <TouchableOpacity onPress={handleAuthorPress} activeOpacity={0.8}>
        <Image source={{ uri: author.avatarUrl }} style={styles.avatar} />
      </TouchableOpacity>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleAuthorPress} activeOpacity={0.8}>
            <Text style={styles.displayName}>{author.displayName}</Text>
          </TouchableOpacity>
          <Text style={styles.meta}>
            {author.department} · {formatTimeAgo(post.createdAt)}
          </Text>
        </View>
        
        <Text style={styles.text}>{post.content}</Text>
        
        {post.tags.length > 0 && (
          <View style={styles.tags}>
            {post.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Heart
              size={18}
              color={hasLiked ? colors.like : colors.textMuted}
              fill={hasLiked ? colors.like : 'transparent'}
            />
            <Text style={[styles.actionText, hasLiked && styles.likedText]}>
              {post.likes.length}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            <MessageCircle size={18} color={colors.textMuted} />
            <Text style={styles.actionText}>{post.repliesCount}</Text>
          </TouchableOpacity>
        </View>
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
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.borderLight,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 6,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  text: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: colors.tag,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 13,
    color: colors.tagText,
    fontWeight: '500' as const,
  },
  actions: {
    flexDirection: 'row',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  likedText: {
    color: colors.like,
  },
});
