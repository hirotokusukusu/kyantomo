import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { FriendRequest, Friendship } from '@/types';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

type FriendRequestRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
};

type FriendshipRow = {
  id: string;
  user_id1: string;
  user_id2: string;
  created_at: string;
};

const normalizePair = (a: string, b: string) => (a < b ? [a, b] : [b, a]);

export const [FriendsProvider, useFriends] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const requestsQuery = useQuery({
    queryKey: ['friendRequests', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .returns<FriendRequestRow[]>();
      if (error) throw error;

      return (data ?? []).map<FriendRequest>((row) => ({
        id: row.id,
        fromUserId: row.from_user_id,
        toUserId: row.to_user_id,
        status: row.status,
        createdAt: row.created_at,
      }));
    },
  });

  const friendshipsQuery = useQuery({
    queryKey: ['friendships', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`)
        .returns<FriendshipRow[]>();
      if (error) throw error;

      return (data ?? []).map<Friendship>((row) => ({
        id: row.id,
        userId1: row.user_id1,
        userId2: row.user_id2,
        createdAt: row.created_at,
      }));
    },
  });

  const friendRequests = requestsQuery.data ?? [];
  const friendships = friendshipsQuery.data ?? [];

  const sendRequestMutation = useMutation({
    mutationFn: async (toUserId: string) => {
      if (!user) throw new Error('ログインが必要です');
      if (toUserId === user.id) throw new Error('自分には送信できません');

      const exists = friendRequests.some(
        (r) =>
          (r.fromUserId === user.id && r.toUserId === toUserId && r.status === 'pending') ||
          (r.fromUserId === toUserId && r.toUserId === user.id && r.status === 'pending'),
      );
      if (exists) throw new Error('すでにリクエストが存在します');

      const alreadyFriend = friendships.some(
        (f) =>
          (f.userId1 === user.id && f.userId2 === toUserId) ||
          (f.userId1 === toUserId && f.userId2 === user.id),
      );
      if (alreadyFriend) throw new Error('すでに友達です');

      const { error } = await supabase.from('friend_requests').insert({
        from_user_id: user.id,
        to_user_id: toUserId,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests', user?.id] });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('ログインが必要です');

      const request = friendRequests.find((r) => r.id === requestId);
      if (!request) throw new Error('リクエストが見つかりません');
      if (request.toUserId !== user.id) throw new Error('承認権限がありません');

      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
      if (updateError) throw updateError;

      const [userId1, userId2] = normalizePair(request.fromUserId, request.toUserId);
      const { error: friendshipError } = await supabase.from('friendships').upsert(
        {
          user_id1: userId1,
          user_id2: userId2,
        },
        { onConflict: 'user_id1,user_id2' },
      );
      if (friendshipError) throw friendshipError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['friendships', user?.id] });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.from('friend_requests').delete().eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests', user?.id] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendUserId: string) => {
      if (!user) throw new Error('ログインが必要です');

      const [userId1, userId2] = normalizePair(user.id, friendUserId);
      const { error: friendshipError } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id1', userId1)
        .eq('user_id2', userId2);
      if (friendshipError) throw friendshipError;

      await supabase
        .from('friend_requests')
        .delete()
        .or(
          `and(from_user_id.eq.${user.id},to_user_id.eq.${friendUserId}),and(from_user_id.eq.${friendUserId},to_user_id.eq.${user.id})`,
        );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests', user?.id] });
    },
  });

  const pendingRequests = useMemo(() => {
    if (!user) return [];
    return friendRequests.filter((r) => r.toUserId === user.id && r.status === 'pending');
  }, [friendRequests, user]);

  const sentRequests = useMemo(() => {
    if (!user) return [];
    return friendRequests.filter((r) => r.fromUserId === user.id && r.status === 'pending');
  }, [friendRequests, user]);

  const friends = useMemo(() => {
    if (!user) return [];
    return friendships
      .filter((f) => f.userId1 === user.id || f.userId2 === user.id)
      .map((f) => (f.userId1 === user.id ? f.userId2 : f.userId1));
  }, [friendships, user]);

  const isFriend = useCallback((userId: string) => friends.includes(userId), [friends]);

  const hasPendingRequest = useCallback(
    (userId: string) => {
      if (!user) return false;
      return friendRequests.some(
        (r) =>
          r.status === 'pending' &&
          ((r.fromUserId === user.id && r.toUserId === userId) ||
            (r.fromUserId === userId && r.toUserId === user.id)),
      );
    },
    [friendRequests, user],
  );

  const getRequestStatus = useCallback(
    (userId: string): 'none' | 'sent' | 'received' | 'friend' => {
      if (!user) return 'none';
      if (isFriend(userId)) return 'friend';

      const request = friendRequests.find(
        (r) =>
          r.status === 'pending' &&
          ((r.fromUserId === user.id && r.toUserId === userId) ||
            (r.fromUserId === userId && r.toUserId === user.id)),
      );

      if (!request) return 'none';
      return request.fromUserId === user.id ? 'sent' : 'received';
    },
    [friendRequests, isFriend, user],
  );

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
