import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, Edit2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/contexts/PostsContext';
import ProfileHeader from '@/components/ProfileHeader';
import PostCard from '@/components/PostCard';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { posts } = usePosts();

  const userPosts = user ? posts.filter((post) => post.userId === user.id) : [];

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login' as any);
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/(tabs)/profile/edit' as any);
  };

  const handlePostPress = (postId: string) => {
    router.push(`/(tabs)/(feed)/${postId}` as any);
  };

  if (!user) {
    return (
      <View style={styles.notLoggedIn}>
        <Text style={styles.notLoggedInText}>ログインしてください</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace('/(auth)/login' as any)}
        >
          <Text style={styles.loginButtonText}>ログイン</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      <ProfileHeader user={user} />
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Edit2 size={18} color={colors.primary} />
          <Text style={styles.editButtonText}>プロフィール編集</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={18} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.postsHeader}>
        <Text style={styles.postsTitle}>投稿 ({userPosts.length})</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard post={item} onPress={() => handlePostPress(item.id)} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyPosts}>
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
  notLoggedIn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  notLoggedInText: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    gap: 12,
    borderBottomWidth: 8,
    borderBottomColor: colors.borderLight,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tag,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  logoutButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
  },
  postsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  postsTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  emptyPosts: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
