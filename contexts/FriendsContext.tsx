import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { FriendRequest, Friendship } from '@/types';
import { useAuth } from './AuthContext';

const FRIEND_REQUESTS_KEY = 'friend_requests';
const FRIENDSHIPS_KEY = 'friendships';

export const [FriendsProvider, useFriends] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);

  const requestsQuery = useQuery({
    queryKey: ['friendRequests'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(FRIEND_REQUESTS_KEY);
      return stored ? JSON.parse(stored) as FriendRequest[] : [];
    },
  });

  const friendshipsQuery = useQuery({
    queryKey: ['friendships'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(FRIENDSHIPS_KEY);
      return stored ? JSON.parse(stored) as Friendship[] : [];
    },
  });

  useEffect(() => {
    if (requestsQuery.data) {
      setFriendRequests(requestsQuery.data);
    }
  }, [requestsQuery.data]);

  useEffect(() => {
    if (friendshipsQuery.data) {
      setFriendships(friendshipsQuery.data);
    }
  }, [friendshipsQuery.data]);

  const sendRequestMutation = useMutation({
    mutationFn: async (toUserId: string) => {
      if (!user) throw new Error('ログインが必要です');
      
      const existingRequest = friendRequests.find(
        r => (r.fromUserId === user.id && r.toUserId === toUserId) ||
             (r.fromUserId === toUserId && r.toUserId === user.id)
      );
      if (existingRequest) throw new Error('すでにリクエストが存在します');

      const isFriend = friendships.some(
        f => (f.userId1 === user.id && f.userId2 === toUserId) ||
             (f.userId1 === toUserId && f.userId2 === user.id)
      );
      if (isFriend) throw new Error('すでに友達です');

      const newRequest: FriendRequest = {
        id: `request-${Date.now()}`,
        fromUserId: user.id,
        toUserId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      const updated = [...friendRequests, newRequest];
      await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      setFriendRequests(data);
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('ログインが必要です');

      const request = friendRequests.find(r => r.id === requestId);
      if (!request) throw new Error('リクエストが見つかりません');

      const updatedRequests = friendRequests.map(r =>
        r.id === requestId ? { ...r, status: 'accepted' as const } : r
      );

      const newFriendship: Friendship = {
        id: `friendship-${Date.now()}`,
        userId1: request.fromUserId,
        userId2: request.toUserId,
        createdAt: new Date().toISOString(),
      };

      const updatedFriendships = [...friendships, newFriendship];

      await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(updatedRequests));
      await AsyncStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(updatedFriendships));

      return { requests: updatedRequests, friendships: updatedFriendships };
    },
    onSuccess: (data) => {
      setFriendRequests(data.requests);
      setFriendships(data.friendships);
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const updatedRequests = friendRequests.filter(r => r.id !== requestId);
      await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(updatedRequests));
      return updatedRequests;
    },
    onSuccess: (data) => {
      setFriendRequests(data);
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendUserId: string) => {
      if (!user) throw new Error('ログインが必要です');

      const updatedFriendships = friendships.filter(
        f => !((f.userId1 === user.id && f.userId2 === friendUserId) ||
               (f.userId1 === friendUserId && f.userId2 === user.id))
      );

      const updatedRequests = friendRequests.filter(
        r => !((r.fromUserId === user.id && r.toUserId === friendUserId) ||
               (r.fromUserId === friendUserId && r.toUserId === user.id))
      );

      await AsyncStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(updatedFriendships));
      await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(updatedRequests));

      return { friendships: updatedFriendships, requests: updatedRequests };
    },
    onSuccess: (data) => {
      setFriendships(data.friendships);
      setFriendRequests(data.requests);
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });

  const pendingRequests = useMemo(() => {
    if (!user) return [];
    return friendRequests.filter(r => r.toUserId === user.id && r.status === 'pending');
  }, [friendRequests, user]);

  const sentRequests = useMemo(() => {
    if (!user) return [];
    return friendRequests.filter(r => r.fromUserId === user.id && r.status === 'pending');
  }, [friendRequests, user]);

  const friends = useMemo(() => {
    if (!user) return [];
    return friendships
      .filter(f => f.userId1 === user.id || f.userId2 === user.id)
      .map(f => f.userId1 === user.id ? f.userId2 : f.userId1);
  }, [friendships, user]);

  const isFriend = useCallback((userId: string) => {
    return friends.includes(userId);
  }, [friends]);

  const hasPendingRequest = useCallback((userId: string) => {
    if (!user) return false;
    return friendRequests.some(
      r => r.status === 'pending' &&
           ((r.fromUserId === user.id && r.toUserId === userId) ||
            (r.fromUserId === userId && r.toUserId === user.id))
    );
  }, [friendRequests, user]);

  const getRequestStatus = useCallback((userId: string): 'none' | 'sent' | 'received' | 'friend' => {
    if (!user) return 'none';
    if (isFriend(userId)) return 'friend';
    
    const request = friendRequests.find(
      r => r.status === 'pending' &&
           ((r.fromUserId === user.id && r.toUserId === userId) ||
            (r.fromUserId === userId && r.toUserId === user.id))
    );
    
    if (!request) return 'none';
    if (request.fromUserId === user.id) return 'sent';
    return 'received';
  }, [friendRequests, user, isFriend]);

  return {
    friendRequests,
    friendships,
    pendingRequests,
    sentRequests,
    friends,
    isFriend,
    hasPendingRequest,
    getRequestStatus,
    sendRequest: sendRequestMutation.mutateAsync,
    acceptRequest: acceptRequestMutation.mutateAsync,
    rejectRequest: rejectRequestMutation.mutateAsync,
    removeFriend: removeFriendMutation.mutateAsync,
    isLoading: requestsQuery.isLoading || friendshipsQuery.isLoading,
    isSending: sendRequestMutation.isPending,
  };
});
