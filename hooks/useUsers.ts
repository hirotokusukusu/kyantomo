import { useMemo, useCallback } from 'react';
import { mockUsers } from '@/mocks/users';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useUsers() {
  const { user: currentUser } = useAuth();

  const users = useMemo(() => {
    if (!currentUser) return mockUsers;
    const exists = mockUsers.some(u => u.id === currentUser.id);
    if (exists) return mockUsers;
    return [...mockUsers, currentUser];
  }, [currentUser]);

  const getUserById = useCallback((id: string): User | undefined => {
    if (currentUser && currentUser.id === id) return currentUser;
    return mockUsers.find(user => user.id === id);
  }, [currentUser]);

  return { users, getUserById };
}

export function useFilteredUsers(searchQuery: string) {
  const { users } = useUsers();
  
  return useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.displayName.toLowerCase().includes(query) ||
      user.department.toLowerCase().includes(query) ||
      user.hobbies.some(hobby => hobby.toLowerCase().includes(query)) ||
      user.courses.some(course => course.toLowerCase().includes(query))
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

    users.forEach(user => {
      if (user.id === currentUser.id) return;

      const matchedHobbies = user.hobbies.filter(hobby => 
        currentUser.hobbies.includes(hobby)
      );
      const matchedCourses = user.courses.filter(course => 
        currentUser.courses.includes(course)
      );

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

  const hobbyMatches = useMemo(() => 
    matchedUsers.filter(u => u.matchedHobbies.length > 0),
    [matchedUsers]
  );

  const courseMatches = useMemo(() => 
    matchedUsers.filter(u => u.matchedCourses.length > 0),
    [matchedUsers]
  );

  return {
    matchedUsers,
    hobbyMatches,
    courseMatches,
  };
}
