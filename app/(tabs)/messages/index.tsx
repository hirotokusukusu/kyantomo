import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { UserPlus, MessageCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useMessages } from '@/contexts/MessagesContext';
import { useFriends } from '@/contexts/FriendsContext';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation } from '@/types';

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { conversations, getUnreadCount, getOtherParticipant } = useMessages();
  const { pendingRequests } = useFriends();
  const { getUserById } = useUsers();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    }
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUserId = getOtherParticipant(item);
    if (!otherUserId) return null;
    
    const otherUser = getUserById(otherUserId);
    if (!otherUser) return null;

    const unreadCount = getUnreadCount(otherUserId);

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => router.push(`/(tabs)/messages/${otherUserId}` as any)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: otherUser.avatarUrl }} style={styles.avatar} />
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName} numberOfLines={1}>{otherUser.displayName}</Text>
            {item.lastMessage && (
              <Text style={styles.timeText}>{formatTime(item.lastMessage.createdAt)}</Text>
            )}
          </View>
          <View style={styles.messagePreview}>
            <Text style={[styles.lastMessage, unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
              {item.lastMessage?.senderId === user?.id ? '自分: ' : ''}
              {item.lastMessage?.content || 'メッセージがありません'}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.friendRequestsButton}
        onPress={() => router.push('/(tabs)/messages/friends' as any)}
        activeOpacity={0.7}
      >
        <View style={styles.friendRequestsLeft}>
          <View style={styles.iconContainer}>
            <UserPlus size={20} color={colors.primary} />
          </View>
          <Text style={styles.friendRequestsText}>友達リクエスト</Text>
        </View>
        {pendingRequests.length > 0 && (
          <View style={styles.requestBadge}>
            <Text style={styles.requestBadgeText}>{pendingRequests.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>メッセージ</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MessageCircle size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>メッセージはありません</Text>
            <Text style={styles.emptySubtitle}>友達になってメッセージを送りましょう</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  friendRequestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  friendRequestsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendRequestsText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
  },
  requestBadge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  requestBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: colors.text,
    fontWeight: '500' as const,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
