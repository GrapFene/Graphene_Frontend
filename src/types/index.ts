export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  community: string;
  votes: number;
  commentCount: number;
  timestamp: string;
  imageUrl?: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  votes: number;
  timestamp: string;
  replies?: Comment[];
}

export interface Community {
  name: string;
  members: number;
  color: string;
}
