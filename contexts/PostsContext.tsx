import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Post, Reply } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

type PostRow = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
};

type ReplyRow = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
};

const fetchPosts = async (): Promise<Post[]> => {
  const { data: basePosts, error: postsError } = await supabase
    .from('posts')
    .select('id, author_id, content, created_at')
    .order('created_at', { ascending: false })
    .returns<PostRow[]>();
  if (postsError) throw postsError;
  if (!basePosts || basePosts.length === 0) return [];

  const ids = basePosts.map((p) => p.id);

  const [{ data: tagRows, error: tagError }, { data: likeRows, error: likeError }, { data: replyRows, error: replyError }] =
    await Promise.all([
      supabase.from('post_hashtags').select('post_id, hashtags(name)').in('post_id', ids),
      supabase.from('post_likes').select('post_id, user_id').in('post_id', ids),
      supabase.from('post_comments').select('post_id').in('post_id', ids),
    ]);

  if (tagError) throw tagError;
  if (likeError) throw likeError;
  if (replyError) throw replyError;

  const tagsByPost = new Map<string, string[]>();
  (tagRows ?? []).forEach((row: any) => {
    const current = tagsByPost.get(row.post_id) ?? [];
    const name = row.hashtags?.name;
    if (name) current.push(name);
    tagsByPost.set(row.post_id, current);
  });

  const likesByPost = new Map<string, string[]>();
  (likeRows ?? []).forEach((row: any) => {
    const current = likesByPost.get(row.post_id) ?? [];
    current.push(row.user_id);
    likesByPost.set(row.post_id, current);
  });

  const repliesCountByPost = new Map<string, number>();
  (replyRows ?? []).forEach((row: any) => {
    repliesCountByPost.set(row.post_id, (repliesCountByPost.get(row.post_id) ?? 0) + 1);
  });

  return basePosts.map((row) => ({
    id: row.id,
    userId: row.author_id,
    content: row.content,
    tags: tagsByPost.get(row.id) ?? [],
    likes: likesByPost.get(row.id) ?? [],
    repliesCount: repliesCountByPost.get(row.id) ?? 0,
    createdAt: row.created_at,
  }));
};

const fetchReplies = async (): Promise<Reply[]> => {
  const { data, error } = await supabase
    .from('post_comments')
    .select('id, post_id, author_id, content, created_at')
    .order('created_at', { ascending: true })
    .returns<ReplyRow[]>();
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    postId: row.post_id,
    userId: row.author_id,
    content: row.content,
    createdAt: row.created_at,
  }));
};

export const [PostsProvider, usePosts] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const postsQuery = useQuery({
    queryKey: ['posts'],
    enabled: !!user,
    queryFn: () => (user ? fetchPosts() : []),
  });

  const repliesQuery = useQuery({
    queryKey: ['replies'],
    enabled: !!user,
    queryFn: () => (user ? fetchReplies() : []),
  });

  const createPostMutation = useMutation({
    mutationFn: async ({ userId, content, tags }: { userId: string; content: string; tags: string[] }) => {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: userId,
          content,
        })
        .select('id')
        .single<{ id: string }>();
      if (error) throw error;

      if (tags.length > 0) {
        const { error: tagsError } = await supabase.rpc('set_post_hashtags', {
          p_post_id: data.id,
          p_tags: tags,
        });
        if (tagsError) throw tagsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, userId }: { postId: string; userId: string }) => {
      const currentPost = (postsQuery.data ?? []).find((p) => p.id === postId);
      const alreadyLiked = currentPost?.likes.includes(userId) ?? false;

      if (alreadyLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from('post_likes').insert({
        post_id: postId,
        user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const addReplyMutation = useMutation({
    mutationFn: async ({ postId, userId, content }: { postId: string; userId: string; content: string }) => {
      const { error } = await supabase.from('post_comments').insert({
        post_id: postId,
        author_id: userId,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
    },
  });

  const replies = repliesQuery.data ?? [];
  const posts = postsQuery.data ?? [];

  const getPostReplies = (postId: string) => replies.filter((reply) => reply.postId === postId);

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [posts],
  );

  return {
    posts: sortedPosts,
    replies,
    isLoading: postsQuery.isLoading || repliesQuery.isLoading,
    createPost: createPostMutation.mutateAsync,
    toggleLike: toggleLikeMutation.mutate,
    addReply: addReplyMutation.mutateAsync,
    getPostReplies,
    isCreatingPost: createPostMutation.isPending,
  };
});

export function useFilteredPosts(searchQuery: string) {
  const { posts } = usePosts();

  return useMemo(() => {
    if (!searchQuery.trim()) return posts;

    const query = searchQuery.toLowerCase();
    return posts.filter(
      (post) =>
        post.content.toLowerCase().includes(query) ||
        post.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }, [posts, searchQuery]);
}
