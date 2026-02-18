import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useMessages } from '@/contexts/MessagesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useFriends } from '@/contexts/FriendsContext';
import { Message } from '@/types';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();
  const { getConversationMessages, sendMessage, markAsRead, isSending } = useMessages();
  const { isFriend } = useFriends();
  const { getUserById } = useUsers();
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const otherUser = chatId ? getUserById(chatId) : null;
  const messages = chatId ? getConversationMessages(chatId) : [];
  const canMessage = chatId ? isFriend(chatId) : false;

  useEffect(() => {
    if (chatId) {
      markAsRead(chatId);
    }
  }, [chatId, messages.length, markAsRead]);

  const handleSend = async () => {
    if (!messageText.trim() || !chatId || isSending) return;

    const text = messageText.trim();
    setMessageText('');

    try {
      await sendMessage({ receiverId: chatId, content: text });
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.log('Failed to send message:', error);
      setMessageText(text);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.id;
    const showDate = index === 0 || 
      new Date(item.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString('ja-JP', { 
                month: 'long', 
                day: 'numeric',
                weekday: 'short'
              })}
            </Text>
          </View>
        )}
        <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
          {!isMe && otherUser && (
            <Image source={{ uri: otherUser.avatarUrl }} style={styles.messageAvatar} />
          )}
          <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>{item.content}</Text>
            <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (!otherUser) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>ユーザーが見つかりません</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: otherUser.displayName }} />
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Image source={{ uri: otherUser.avatarUrl }} style={styles.emptyAvatar} />
            <Text style={styles.emptyChatTitle}>{otherUser.displayName}</Text>
            <Text style={styles.emptyChatSubtitle}>
              {canMessage ? 'メッセージを送信してみましょう' : '友達になってメッセージを送りましょう'}
            </Text>
          </View>
        }
      />

      {canMessage ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="メッセージを入力..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!messageText.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim() || isSending}
          >
            <Send size={20} color={messageText.trim() && !isSending ? '#fff' : colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.notFriendBanner}>
          <Text style={styles.notFriendText}>友達になるとメッセージを送信できます</Text>
        </View>
      )}
    </KeyboardAvoidingView>
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
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    flexGrow: 1,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  messageRowMe: {
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageBubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  emptyChatSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.backgroundSecondary,
  },
  notFriendBanner: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  notFriendText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
