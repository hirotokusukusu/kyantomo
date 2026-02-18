import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { usePosts } from '@/contexts/PostsContext';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/PostCard';
import ReplyCard from '@/components/ReplyCard';

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { posts, getPostReplies, addReply } = usePosts();
  const { user } = useAuth();
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const post = posts.find((p) => p.id === postId);
  const replies = postId ? getPostReplies(postId) : [];

  if (!post) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>投稿が見つかりません</Text>
      </View>
    );
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !user || !postId) return;

    setIsSending(true);
    try {
      await addReply({
        postId,
        userId: user.id,
        content: replyText.trim(),
      });
      setReplyText('');
    } catch (error) {
      Alert.alert('エラー', '返信の送信に失敗しました');
    } finally {
      setIsSending(false);
    }
  };

  const renderHeader = () => (
    <View>
      <PostCard post={post} />
      {replies.length > 0 && (
        <View style={styles.repliesHeader}>
          <Text style={styles.repliesTitle}>返信 ({replies.length})</Text>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={replies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReplyCard reply={item} />}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="返信を入力..."
          placeholderTextColor={colors.textMuted}
          value={replyText}
          onChangeText={setReplyText}
          multiline
          maxLength={280}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!replyText.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSendReply}
          disabled={!replyText.trim() || isSending}
        >
          <Send size={20} color={replyText.trim() && !isSending ? colors.primary : colors.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: 16,
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
  repliesHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 8,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  repliesTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceHover,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
