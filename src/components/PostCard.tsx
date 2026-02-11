import { ArrowUp, ArrowDown, MessageSquare, Share2, Bookmark, AlertCircle } from 'lucide-react';
import { Post } from '../types';
import { useVote } from '../hooks/useVote';
import { motion, AnimatePresence } from 'framer-motion';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { votes, userVote, status, error, handleVote } = useVote({
    initialVotes: post.votes,
    postId: post.id
  });

  const communityColors: Record<string, string> = {
    tech: 'bg-green-400',
    design: 'bg-pink-400',
    music: 'bg-yellow-300',
    gaming: 'bg-cyan-400',
    art: 'bg-red-400',
  };

  const bgColor = communityColors[post.community] || 'bg-purple-400';

  return (
    <article className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
      <div className="flex">
        <div className="flex flex-col items-center gap-2 bg-gray-100 border-r-4 border-black p-4">
          <button
            onClick={() => handleVote('up')}
            disabled={status === 'voting'}
            className={`bg-white border-3 border-black p-2 transition-colors ${userVote === 'up' ? 'bg-green-400' : 'hover:bg-green-300'
              }`}
          >
            <ArrowUp className="w-5 h-5" strokeWidth={3} />
          </button>

          <span className={`font-black text-lg ${userVote === 'up' ? 'text-green-600' :
              userVote === 'down' ? 'text-red-600' : ''
            }`}>
            {votes}
          </span>

          <button
            onClick={() => handleVote('down')}
            disabled={status === 'voting'}
            className={`bg-white border-3 border-black p-2 transition-colors ${userVote === 'down' ? 'bg-red-400' : 'hover:bg-red-300'
              }`}
          >
            <ArrowDown className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 p-6 relative">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-2 right-2 bg-red-100 border-2 border-red-500 text-red-700 px-3 py-1 text-sm font-bold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 mb-3">
            <span className={`${bgColor} border-3 border-black px-3 py-1 font-black text-sm`}>
              g/{post.community}
            </span>
            <span className="font-bold text-gray-600">u/{post.author}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500 font-bold">{post.timestamp}</span>
          </div>

          <h2 className="text-2xl font-black mb-3 leading-tight hover:underline cursor-pointer">
            {post.title}
          </h2>

          <p className="text-gray-700 font-medium mb-4 leading-relaxed">
            {post.content}
          </p>

          {post.imageUrl && (
            <div className="mb-4 border-4 border-black">
              <img
                src={post.imageUrl}
                alt=""
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 bg-white border-3 border-black px-4 py-2 font-bold hover:bg-blue-200 transition-colors">
              <MessageSquare className="w-5 h-5" strokeWidth={3} />
              <span>{post.commentCount}</span>
            </button>

            <button className="flex items-center gap-2 bg-white border-3 border-black px-4 py-2 font-bold hover:bg-blue-200 transition-colors">
              <Share2 className="w-5 h-5" strokeWidth={3} />
              <span>Share</span>
            </button>

            <button className="flex items-center gap-2 bg-white border-3 border-black px-4 py-2 font-bold hover:bg-yellow-200 transition-colors">
              <Bookmark className="w-5 h-5" strokeWidth={3} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
