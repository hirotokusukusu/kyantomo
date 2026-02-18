import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Users, FileText } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useFilteredPosts } from '@/contexts/PostsContext';
import { useFilteredUsers } from '@/hooks/useUsers';
import PostCard from '@/components/PostCard';
import UserCard from '@/components/UserCard';

type SearchTab = 'posts' | 'users';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('posts');

  const filteredPosts = useFilteredPosts(query);
  const filteredUsers = useFilteredUsers(query);

  const handlePostPress = (postId: string) => {
    router.push(`/(tabs)/(feed)/${postId}` as any);
  };

  const renderEmptyState = () => {
    if (!query.trim()) {
      return (
        <View style={styles.emptyState}>
          <Search size={48} color={colors.borderLight} />
          <Text style={styles.emptyTitle}>検索してみよう</Text>
          <Text style={styles.emptySubtitle}>
            キーワードで投稿やユーザーを検索できます
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>結果が見つかりません</Text>
        <Text style={styles.emptySubtitle}>
          別のキーワードで試してみてください
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="投稿・ユーザーを検索"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          testID="search-input"
        />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
          onPress={() => setActiveTab('posts')}
        >
          <FileText size={18} color={activeTab === 'posts' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>
            投稿
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Users size={18} color={activeTab === 'users' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            ユーザー
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'posts' ? (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard post={item} onPress={() => handlePostPress(item.id)} />
          )}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={filteredPosts.length === 0 ? styles.emptyContainer : undefined}
        />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserCard user={item} />}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={filteredUsers.length === 0 ? styles.emptyContainer : undefined}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    height: 44,
    marginLeft: 10,
    fontSize: 16,
    color: colors.text,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '500' as const,
  },
  tabTextActive: {
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 300,
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
