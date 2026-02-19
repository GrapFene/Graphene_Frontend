import { ArrowUp, ArrowDown, MessageSquare, Share2, Bookmark, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Post } from '../types';
import { useVote } from '../hooks/useVote';
import { motion, AnimatePresence } from 'framer-motion';

interface PostCardProps {
  post: Post;
}

/**
 * Post Card Component
 * 
 * Functionality: Displays a single post with voting, content, and interaction buttons.
 * Input: post (Post) - The post data object.
 * Response: JSX.Element - The rendered post card.
 */
export default function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();
  const { votes, userVote, error, handleVote } = useVote({
    initialVotes: post.votes,
    postId: post.id,
    initialUserVote: post.user_vote
  });

  const handleCommentsClick = () => {
    const postUrl = `/r/${post.community}/${post.id}/${post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    navigate(postUrl, { state: { scrollToComments: true } });
  };

  const communityColors: Record<string, string> = {
    tech: 'bg-green-400',
    design: 'bg-pink-400',
    music: 'bg-yellow-300',
    gaming: 'bg-cyan-400',
    art: 'bg-red-400',
  };

  const bgColor = communityColors[post.community] || 'bg-purple-400';

  return (
    <article className="bg-white dark:bg-black border-4 border-black dark:border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(50,50,50,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[12px_12px_0px_0px_rgba(70,70,70,1)] hover:-translate-y-1 transition-all duration-200">
      <div className="flex">
        <div className="flex flex-col items-center gap-2 bg-gray-100 dark:bg-black border-r-4 border-black dark:border-gray-800 p-4 transition-colors duration-200">
          <button
            onClick={() => handleVote('up')}
            className={`bg-white dark:bg-black border-3 border-black dark:border-gray-700 p-2 transition-colors ${userVote === 'up' ? 'bg-green-400 dark:bg-green-600' : 'hover:bg-green-300 dark:hover:bg-green-900'
              } text-black dark:text-white`}
          >
            <ArrowUp className="w-5 h-5" strokeWidth={3} />
          </button>

          <span className={`font-black text-lg ${userVote === 'up' ? 'text-green-600 dark:text-green-400' :
            userVote === 'down' ? 'text-red-600 dark:text-red-400' : 'text-black dark:text-white'
            }`}>
            {votes}
          </span>

          <button
            onClick={() => handleVote('down')}
            className={`bg-white dark:bg-black border-3 border-black dark:border-gray-700 p-2 transition-colors ${userVote === 'down' ? 'bg-red-400 dark:bg-red-600' : 'hover:bg-red-300 dark:hover:bg-red-900'
              } text-black dark:text-white`}
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
            <span className={`${bgColor} border-3 border-black dark:border-gray-700 px-3 py-1 font-black text-sm text-black`}>
              g/{post.community}
            </span>
            <span className="font-bold text-gray-600 dark:text-cyan-400">u/{post.author}</span>
            <span className="text-gray-500 dark:text-gray-500">•</span>
            <span className="text-gray-500 dark:text-gray-400 font-bold">{post.timestamp}</span>
          </div>

          <h2
            className="text-2xl font-black mb-3 leading-tight hover:underline cursor-pointer text-black dark:text-white"
            onClick={() => window.location.href = `/r/${post.community}/${post.id}/${post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          >
            {post.title}
          </h2>

          <p className="text-gray-700 dark:text-gray-300 font-medium mb-4 leading-relaxed">
            {post.content}
          </p>

          {post.imageUrl && (
            <div className="mb-4 border-4 border-black dark:border-gray-700 relative overflow-hidden h-96 flex justify-center items-center bg-gray-100 dark:bg-gray-900">
              {/* Blurred background layer */}
              {post.mediaType !== 'video' && (
                <div
                  className="absolute inset-0 bg-cover bg-center blur-md opacity-50 dark:opacity-30 scale-110 pointer-events-none"
                  style={{ backgroundImage: `url(${post.imageUrl})` }}
                />
              )}

              {/* Main content */}
              <div className="relative z-10 w-full h-full flex justify-center items-center">
                {post.mediaType === 'video' ? (
                  <video src={post.imageUrl} controls className="max-w-full max-h-full object-contain" />
                ) : (
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="max-w-full max-h-full object-contain shadow-sm"
                  />
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleCommentsClick}
              className="flex items-center gap-2 bg-white dark:bg-black border-3 border-black dark:border-gray-700 px-4 py-2 font-bold hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors text-black dark:text-white"
            >
              <MessageSquare className="w-5 h-5" strokeWidth={3} />
              <span>{post.commentCount}</span>
            </button>

            <button className="flex items-center gap-2 bg-white dark:bg-black border-3 border-black dark:border-gray-700 px-4 py-2 font-bold hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors text-black dark:text-white">
              <Share2 className="w-5 h-5" strokeWidth={3} />
              <span>Share</span>
            </button>

            <button className="flex items-center gap-2 bg-white dark:bg-black border-3 border-black dark:border-gray-700 px-4 py-2 font-bold hover:bg-yellow-200 dark:hover:bg-yellow-900 transition-colors text-black dark:text-white">
              <Bookmark className="w-5 h-5" strokeWidth={3} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
