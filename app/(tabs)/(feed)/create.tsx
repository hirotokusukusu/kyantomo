import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Hash } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { usePosts } from '@/contexts/PostsContext';
import { useAuth } from '@/contexts/AuthContext';

const SUGGESTED_TAGS = ['勉強会', '授業', '質問', 'サークル', 'イベント', '友達募集', 'おすすめ'];

export default function CreatePostScreen() {
  const router = useRouter();
  const { createPost, isCreatingPost } = usePosts();
  const { user } = useAuth();
  
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.trim().replace(/^#/, '');
    if (normalizedTag && !tags.includes(normalizedTag) && tags.length < 5) {
      setTags([...tags, normalizedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handlePost = async () => {
    if (!content.trim() || !user) {
      Alert.alert('エラー', '投稿内容を入力してください');
      return;
    }

    try {
      await createPost({
        userId: user.id,
        content: content.trim(),
        tags,
      });
      router.back();
    } catch (error) {
      Alert.alert('エラー', '投稿に失敗しました');
    }
  };

  const canPost = content.trim().length > 0 && !isCreatingPost;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.postButton, !canPost && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={!canPost}
        >
          <Text style={[styles.postButtonText, !canPost && styles.postButtonTextDisabled]}>
            投稿する
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.composer}>
          {user && (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          )}
          <TextInput
            style={styles.textInput}
            placeholder="今何してる？"
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={500}
            autoFocus
            testID="post-content-input"
          />
        </View>

        <View style={styles.charCount}>
          <Text style={[styles.charCountText, content.length > 450 && styles.charCountWarning]}>
            {content.length}/500
          </Text>
        </View>

        <View style={styles.tagSection}>
          <View style={styles.tagInputRow}>
            <Hash size={18} color={colors.textMuted} />
            <TextInput
              style={styles.tagInput}
              placeholder="タグを追加"
              placeholderTextColor={colors.textMuted}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={() => handleAddTag(tagInput)}
              returnKeyType="done"
            />
          </View>

          {tags.length > 0 && (
            <View style={styles.selectedTags}>
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.selectedTag}
                  onPress={() => handleRemoveTag(tag)}
                >
                  <Text style={styles.selectedTagText}>#{tag}</Text>
                  <X size={14} color={colors.tagText} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.suggestedTags}>
            <Text style={styles.suggestedLabel}>おすすめ</Text>
            <View style={styles.tagList}>
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.suggestedTag}
                  onPress={() => handleAddTag(tag)}
                >
                  <Text style={styles.suggestedTagText}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: colors.borderLight,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  postButtonTextDisabled: {
    color: colors.textMuted,
  },
  scrollContent: {
    flex: 1,
  },
  composer: {
    flexDirection: 'row',
    padding: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: colors.borderLight,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    color: colors.text,
    lineHeight: 24,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
  },
  charCountText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  charCountWarning: {
    color: colors.warning,
  },
  tagSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: 16,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHover,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: colors.text,
    marginLeft: 8,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tag,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  selectedTagText: {
    fontSize: 14,
    color: colors.tagText,
    fontWeight: '500' as const,
  },
  suggestedTags: {
    gap: 12,
  },
  suggestedLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500' as const,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedTag: {
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  suggestedTagText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
