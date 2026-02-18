import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Message, Conversation } from '@/types';
import { useAuth } from './AuthContext';

const MESSAGES_KEY = 'messages';
const CONVERSATIONS_KEY = 'conversations';

export const [MessagesProvider, useMessages] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const messagesQuery = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(MESSAGES_KEY);
      return stored ? JSON.parse(stored) as Message[] : [];
    },
  });

  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(CONVERSATIONS_KEY);
      return stored ? JSON.parse(stored) as Conversation[] : [];
    },
  });

  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(messagesQuery.data);
    }
  }, [messagesQuery.data]);

  useEffect(() => {
    if (conversationsQuery.data) {
      setConversations(conversationsQuery.data);
    }
  }, [conversationsQuery.data]);

  const getConversationId = useCallback((userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('-');
  }, []);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!user) throw new Error('ログインが必要です');

      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: user.id,
        receiverId,
        content,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      const updatedMessages = [...messages, newMessage];
      
      const conversationId = getConversationId(user.id, receiverId);
      let updatedConversations = [...conversations];
      const existingConvIndex = updatedConversations.findIndex(c => c.id === conversationId);

      if (existingConvIndex >= 0) {
        updatedConversations[existingConvIndex] = {
          ...updatedConversations[existingConvIndex],
          lastMessage: newMessage,
          updatedAt: newMessage.createdAt,
        };
      } else {
        const newConversation: Conversation = {
          id: conversationId,
          participantIds: [user.id, receiverId] as [string, string],
          lastMessage: newMessage,
          updatedAt: newMessage.createdAt,
        };
        updatedConversations.push(newConversation);
      }

      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
      await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updatedConversations));

      return { messages: updatedMessages, conversations: updatedConversations };
    },
    onSuccess: (data) => {
      setMessages(data.messages);
      setConversations(data.conversations);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error('ログインが必要です');

      const updatedMessages = messages.map(m =>
        m.senderId === otherUserId && m.receiverId === user.id && !m.isRead
          ? { ...m, isRead: true }
          : m
      );

      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
      return updatedMessages;
    },
    onSuccess: (data) => {
      setMessages(data);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const myConversations = useMemo(() => {
    if (!user) return [];
    return conversations
      .filter(c => c.participantIds.includes(user.id))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [conversations, user]);

  const getConversationMessages = useCallback((otherUserId: string) => {
    if (!user) return [];
    return messages
      .filter(m =>
        (m.senderId === user.id && m.receiverId === otherUserId) ||
        (m.senderId === otherUserId && m.receiverId === user.id)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, user]);

  const getUnreadCount = useCallback((otherUserId?: string) => {
    if (!user) return 0;
    if (otherUserId) {
      return messages.filter(
        m => m.senderId === otherUserId && m.receiverId === user.id && !m.isRead
      ).length;
    }
    return messages.filter(m => m.receiverId === user.id && !m.isRead).length;
  }, [messages, user]);

  const getOtherParticipant = useCallback((conversation: Conversation) => {
    if (!user) return null;
    return conversation.participantIds.find(id => id !== user.id) || null;
  }, [user]);

  return {
    messages,
    conversations: myConversations,
    sendMessage: sendMessageMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
    getConversationMessages,
    getUnreadCount,
    getOtherParticipant,
    isLoading: messagesQuery.isLoading || conversationsQuery.isLoading,
    isSending: sendMessageMutation.isPending,
  };
});
