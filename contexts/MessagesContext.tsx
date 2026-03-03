import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { Message, Conversation } from '@/types';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

const toConversationId = (userId1: string, userId2: string) => [userId1, userId2].sort().join('-');

export const [MessagesProvider, useMessages] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const messagesQuery = useQuery({
    queryKey: ['messages', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true })
        .returns<MessageRow[]>();
      if (error) throw error;

      return (data ?? []).map<Message>((row) => ({
        id: row.id,
        senderId: row.sender_id,
        receiverId: row.receiver_id,
        content: row.content,
        isRead: row.is_read,
        createdAt: row.created_at,
      }));
    },
  });

  const messages = messagesQuery.data ?? [];

  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!user) throw new Error('ログインが必要です');
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        is_read: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', user?.id] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error('ログインが必要です');
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', user?.id] });
    },
  });

  const myConversations = useMemo(() => {
    if (!user) return [];

    const byOtherUser = new Map<string, Message>();
    messages.forEach((msg) => {
      const other = msg.senderId === user.id ? msg.receiverId : msg.senderId;
      const current = byOtherUser.get(other);
      if (!current || new Date(msg.createdAt).getTime() > new Date(current.createdAt).getTime()) {
        byOtherUser.set(other, msg);
      }
    });

    const conversations = Array.from(byOtherUser.entries()).map<Conversation>(([otherUserId, lastMessage]) => ({
      id: toConversationId(user.id, otherUserId),
      participantIds: [user.id, otherUserId] as [string, string],
      lastMessage,
      updatedAt: lastMessage.createdAt,
    }));

    return conversations.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [messages, user]);

  const getConversationMessages = useCallback(
    (otherUserId: string) => {
      if (!user) return [];
      return messages
        .filter(
          (m) =>
            (m.senderId === user.id && m.receiverId === otherUserId) ||
            (m.senderId === otherUserId && m.receiverId === user.id),
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
    [messages, user],
  );

  const getUnreadCount = useCallback(
    (otherUserId?: string) => {
      if (!user) return 0;
      if (otherUserId) {
        return messages.filter(
          (m) => m.senderId === otherUserId && m.receiverId === user.id && !m.isRead,
        ).length;
      }
      return messages.filter((m) => m.receiverId === user.id && !m.isRead).length;
    },
    [messages, user],
  );

  const getOtherParticipant = useCallback(
    (conversation: Conversation) => {
      if (!user) return null;
      return conversation.participantIds.find((id) => id !== user.id) || null;
    },
    [user],
  );

  return {
    messages,
    conversations: myConversations,
    sendMessage: sendMessageMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
    getConversationMessages,
    getUnreadCount,
    getOtherParticipant,
    isLoading: messagesQuery.isLoading,
    isSending: sendMessageMutation.isPending,
  };
});
