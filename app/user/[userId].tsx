import { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UserPlus, Check, X, MessageCircle, UserMinus } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useFriends } from '@/contexts/FriendsContext';
import { usePosts } from '@/contexts/PostsContext';
import ProfileHeader from '@/components/ProfileHeader';
import PostCard from '@/components/PostCard';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { getUserById } = useUsers();
  const { posts } = usePosts();
  const {
    getRequestStatus,
    friendRequests,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
  } = useFriends();

  const targetUser = userId ? getUserById(userId) : undefined;
  const isOwnProfile = !!currentUser && !!targetUser && currentUser.id === targetUser.id;
  const status = targetUser ? getRequestStatus(targetUser.id) : 'none';

  const receivedRequestId = useMemo(() => {
    if (!currentUser || !targetUser) return null;
    return (
      friendRequests.find(
        (r) =>
          r.status === 'pending' &&
          r.fromUserId === targetUser.id &&
          r.toUserId === currentUser.id,
      )?.id ?? null
    );
  }, [currentUser, friendRequests, targetUser]);

  const userPosts = useMemo(
    () => (targetUser ? posts.filter((post) => post.userId === targetUser.id) : []),
    [posts, targetUser],
  );

  if (!targetUser) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>ユーザーが見つかりません</Text>
      </View>
    );
  }

  const handleSendRequest = async () => {
    try {
      await sendRequest(targetUser.id);
      Alert.alert('完了', '友達リクエストを送信しました');
    } catch (error) {
      Alert.alert('エラー', error instanceof Error ? error.message : '送信に失敗しました');
    }
  };

  const handleAcceptRequest = async () => {
    if (!receivedRequestId) return;
    try {
      await acceptRequest(receivedRequestId);
    } catch (error) {
      Alert.alert('エラー', error instanceof Error ? error.message : '承認に失敗しました');
    }
  };

  const handleRejectRequest = async () => {
    if (!receivedRequestId) return;
    try {
      await rejectRequest(receivedRequestId);
    } catch (error) {
      Alert.alert('エラー', error instanceof Error ? error.message : '拒否に失敗しました');
    }
  };

  const handleRemoveFriend = () => {
    Alert.alert('友達を解除', `${targetUser.displayName}さんを友達から削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFriend(targetUser.id);
          } catch (error) {
            Alert.alert('エラー', error instanceof Error ? error.message : '削除に失敗しました');
          }
        },
      },
    ]);
  };

  const renderActions = () => {
    if (isOwnProfile) {
      return (
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => router.push('/(tabs)/profile/edit' as any)}
        >
          <Text style={styles.primaryActionText}>プロフィールを編集</Text>
        </TouchableOpacity>
      );
    }

    if (status === 'friend') {
      return (
        <View style={styles.rowActions}>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => router.push(`/(tabs)/messages/${targetUser.id}` as any)}
          >
            <MessageCircle size={18} color={colors.primary} />
            <Text style={styles.secondaryActionText}>メッセージ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerAction} onPress={handleRemoveFriend}>
            <UserMinus size={18} color={colors.error} />
            <Text style={styles.dangerActionText}>友達解除</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === 'received') {
      return (
        <View style={styles.rowActions}>
          <TouchableOpacity style={styles.acceptAction} onPress={handleAcceptRequest}>
            <Check size={18} color="#fff" />
            <Text style={styles.acceptActionText}>承認</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={handleRejectRequest}>
            <X size={18} color={colors.textSecondary} />
            <Text style={styles.secondaryActionText}>拒否</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === 'sent') {
      return (
        <View style={styles.pendingAction}>
          <Check size={16} color={colors.textMuted} />
          <Text style={styles.pendingActionText}>リクエスト送信済み</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity style={styles.primaryAction} onPress={handleSendRequest}>
        <UserPlus size={18} color="#fff" />
        <Text style={styles.primaryActionText}>友達リクエスト</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard post={item} onPress={() => router.push(`/(tabs)/(feed)/${item.id}` as any)} />
        )}
        ListHeaderComponent={
          <View>
            <ProfileHeader user={targetUser} />
            <View style={styles.actions}>{renderActions()}</View>
            <View style={styles.postsHeader}>
              <Text style={styles.postsHeaderText}>投稿 ({userPosts.length})</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>まだ投稿がありません</Text>
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
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  actions: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  secondaryAction: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  dangerAction: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dangerActionText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  acceptAction: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  acceptActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  pendingAction: {
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  pendingActionText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  postsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  postsHeaderText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600' as const,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
