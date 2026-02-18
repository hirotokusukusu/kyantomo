import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { Post, Reply } from '@/types';
import { mockPosts, mockReplies } from '@/mocks/posts';

const POSTS_STORAGE_KEY = 'campus_posts';
const REPLIES_STORAGE_KEY = 'campus_replies';

export const [PostsProvider, usePosts] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);

  const postsQuery = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as Post[];
      }
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(mockPosts));
      return mockPosts;
    },
  });

  const repliesQuery = useQuery({
    queryKey: ['replies'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(REPLIES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as Reply[];
      }
      await AsyncStorage.setItem(REPLIES_STORAGE_KEY, JSON.stringify(mockReplies));
      return mockReplies;
    },
  });

  useEffect(() => {
    if (postsQuery.data) {
      setPosts(postsQuery.data);
    }
  }, [postsQuery.data]);

  useEffect(() => {
    if (repliesQuery.data) {
      setReplies(repliesQuery.data);
    }
  }, [repliesQuery.data]);

  const createPostMutation = useMutation({
    mutationFn: async ({ userId, content, tags }: { userId: string; content: string; tags: string[] }) => {
      const newPost: Post = {
        id: `post-${Date.now()}`,
        userId,
        content,
        tags,
        likes: [],
        repliesCount: 0,
        createdAt: new Date().toISOString(),
      };
      const updatedPosts = [newPost, ...posts];
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updatedPosts));
      return { newPost, updatedPosts };
    },
    onSuccess: ({ updatedPosts }) => {
      setPosts(updatedPosts);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, userId }: { postId: string; userId: string }) => {
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          const hasLiked = post.likes.includes(userId);
          return {
            ...post,
            likes: hasLiked
              ? post.likes.filter(id => id !== userId)
              : [...post.likes, userId],
          };
        }
        return post;
      });
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updatedPosts));
      return updatedPosts;
    },
    onSuccess: (updatedPosts) => {
      setPosts(updatedPosts);
    },
  });

  const addReplyMutation = useMutation({
    mutationFn: async ({ postId, userId, content }: { postId: string; userId: string; content: string }) => {
      const newReply: Reply = {
        id: `reply-${Date.now()}`,
        postId,
        userId,
        content,
        createdAt: new Date().toISOString(),
      };
      
      const updatedReplies = [...replies, newReply];
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          return { ...post, repliesCount: post.repliesCount + 1 };
        }
        return post;
      });
      
      await AsyncStorage.setItem(REPLIES_STORAGE_KEY, JSON.stringify(updatedReplies));
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updatedPosts));
      
      return { updatedReplies, updatedPosts };
    },
    onSuccess: ({ updatedReplies, updatedPosts }) => {
      setReplies(updatedReplies);
      setPosts(updatedPosts);
    },
  });

  const getPostReplies = (postId: string) => {
    return replies.filter(reply => reply.postId === postId);
  };

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [posts]);

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
    return posts.filter(post => 
      post.content.toLowerCase().includes(query) ||
      post.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [posts, searchQuery]);
}
