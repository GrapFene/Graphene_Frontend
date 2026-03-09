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
  user_vote?: number | null;
  // Federation
  source_instance_url?: string | null;
  peer_domain?: string | null;
  is_federated_post?: boolean;
  is_verified?: boolean;
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
