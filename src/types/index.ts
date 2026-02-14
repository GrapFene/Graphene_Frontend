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
  mediaType?: 'image' | 'video';
  user_vote?: number | null; // 1 for upvote, -1 for downvote, null for no vote
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
