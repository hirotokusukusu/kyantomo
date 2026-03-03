import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  department: string | null;
  year: number | null;
  hobbies: string[] | null;
  courses: string[] | null;
  bio: string | null;
  created_at: string;
};

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face';

const profileToUser = (row: ProfileRow): User => ({
  id: row.id,
  email: '',
  displayName: row.display_name,
  avatarUrl: row.avatar_url ?? DEFAULT_AVATAR,
  department: row.department ?? '',
  year: row.year ?? 1,
  hobbies: row.hobbies ?? [],
  courses: row.courses ?? [],
  bio: row.bio ?? '',
  createdAt: row.created_at,
});

export function useUsers() {
  const { user: currentUser } = useAuth();

  const usersQuery = useQuery({
    queryKey: ['users'],
    enabled: !!currentUser,
    queryFn: async () => {
      if (!currentUser) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<ProfileRow[]>();

      if (error) throw error;
      return (data ?? []).map(profileToUser);
    },
  });

  const users = useMemo(() => {
    const list = usersQuery.data ?? [];
    if (!currentUser) return list;
    const exists = list.some((u) => u.id === currentUser.id);
    if (exists) return list.map((u) => (u.id === currentUser.id ? currentUser : u));
    return [currentUser, ...list];
  }, [usersQuery.data, currentUser]);

  const getUserById = useCallback(
    (id: string): User | undefined => {
      if (currentUser?.id === id) return currentUser;
      return users.find((u) => u.id === id);
    },
    [currentUser, users],
  );

  return { users, getUserById, isLoading: usersQuery.isLoading };
}

export function useFilteredUsers(searchQuery: string) {
  const { users } = useUsers();

  return useMemo(() => {
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(query) ||
        user.department.toLowerCase().includes(query) ||
        user.hobbies.some((hobby) => hobby.toLowerCase().includes(query)) ||
        user.courses.some((course) => course.toLowerCase().includes(query)),
    );
  }, [users, searchQuery]);
}

export interface MatchedUser extends User {
  matchType: 'hobby' | 'course' | 'both';
  matchedHobbies: string[];
  matchedCourses: string[];
  matchScore: number;
}

export function useMatchingUsers() {
  const { users } = useUsers();
  const { user: currentUser } = useAuth();

  const matchedUsers = useMemo(() => {
    if (!currentUser) return [];

    const results: MatchedUser[] = [];

    users.forEach((user) => {
      if (user.id === currentUser.id) return;

      const matchedHobbies = user.hobbies.filter((hobby) => currentUser.hobbies.includes(hobby));
      const matchedCourses = user.courses.filter((course) => currentUser.courses.includes(course));

      if (matchedHobbies.length === 0 && matchedCourses.length === 0) return;

      let matchType: 'hobby' | 'course' | 'both' = 'hobby';
      if (matchedHobbies.length > 0 && matchedCourses.length > 0) {
        matchType = 'both';
      } else if (matchedCourses.length > 0) {
        matchType = 'course';
      }

      const matchScore = matchedHobbies.length * 2 + matchedCourses.length * 3;

      results.push({
        ...user,
        matchType,
        matchedHobbies,
        matchedCourses,
        matchScore,
      });
    });

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }, [users, currentUser]);

  const hobbyMatches = useMemo(
    () => matchedUsers.filter((u) => u.matchedHobbies.length > 0),
    [matchedUsers],
  );

  const courseMatches = useMemo(
    () => matchedUsers.filter((u) => u.matchedCourses.length > 0),
    [matchedUsers],
  );

  return {
    matchedUsers,
    hobbyMatches,
    courseMatches,
  };
}
