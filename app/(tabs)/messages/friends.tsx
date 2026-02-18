import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Check, X, UserMinus, MessageCircle, Users } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useFriends } from '@/contexts/FriendsContext';
import { useUsers } from '@/hooks/useUsers';
import { FriendRequest } from '@/types';

type TabType = 'requests' | 'friends';

export default function FriendsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const { pendingRequests, friends, acceptRequest, rejectRequest, removeFriend } = useFriends();
  const { getUserById } = useUsers();

  const handleAccept = async (requestId: string) => {
    try {
      await acceptRequest(requestId);
    } catch (error) {
      console.log('Failed to accept request:', error);
      Alert.alert('エラー', '承認に失敗しました');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest(requestId);
    } catch (error) {
      console.log('Failed to reject request:', error);
      Alert.alert('エラー', '拒否に失敗しました');
    }
  };

  const handleRemoveFriend = (userId: string, userName: string) => {
    Alert.alert(
      '友達を削除',
      `${userName}さんを友達から削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(userId);
            } catch (error) {
              console.log('Failed to remove friend:', error);
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const renderRequest = ({ item }: { item: FriendRequest }) => {
    const fromUser = getUserById(item.fromUserId);
    if (!fromUser) return null;

    return (
      <View style={styles.requestItem}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => router.push(`/user/${fromUser.id}` as any)}
        >
          <Image source={{ uri: fromUser.avatarUrl }} style={styles.avatar} />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{fromUser.displayName}</Text>
            <Text style={styles.userDepartment}>{fromUser.department} {fromUser.year}年</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAccept(item.id)}
          >
            <Check size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleReject(item.id)}
          >
            <X size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFriend = ({ item: userId }: { item: string }) => {
    const friend = getUserById(userId);
    if (!friend) return null;

    return (
      <View style={styles.friendItem}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => router.push(`/user/${friend.id}` as any)}
        >
          <Image source={{ uri: friend.avatarUrl }} style={styles.avatar} />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{friend.displayName}</Text>
            <Text style={styles.userDepartment}>{friend.department} {friend.year}年</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.friendActions}>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => router.push(`/(tabs)/messages/${friend.id}` as any)}
          >
            <MessageCircle size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFriend(friend.id, friend.displayName)}
          >
            <UserMinus size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            リクエスト {pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            友達 ({friends.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'requests' ? (
        <FlatList
          data={pendingRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={pendingRequests.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>リクエストはありません</Text>
              <Text style={styles.emptySubtitle}>新しい友達リクエストがここに表示されます</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item}
          renderItem={renderFriend}
          contentContainerStyle={friends.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>友達がいません</Text>
              <Text style={styles.emptySubtitle}>ユーザーを検索して友達を追加しましょう</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.primary,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  userDepartment: {
    fontSize: 13,
    color: colors.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
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
