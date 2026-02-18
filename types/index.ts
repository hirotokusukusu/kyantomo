export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  department: string;
  year: number;
  hobbies: string[];
  courses: string[];
  bio: string;
  createdAt: string;
  profileCompleted?: boolean;
  emailVerified?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  tags: string[];
  likes: string[];
  repliesCount: number;
  createdAt: string;
}

export interface Reply {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: [string, string];
  lastMessage: Message | null;
  updatedAt: string;
}
