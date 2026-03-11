import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import CreatePostPage from './pages/CreatePostPage';
import CommunityPage from './pages/CommunityPage';
import PostDetailsPage from './pages/PostDetailsPage';
import SearchPage from './pages/SearchPage';
import RecoveryPage from './pages/RecoveryPage';
import AboutPage from './pages/AboutPage';
import MyPostsPage from './pages/MyPostsPage';
import FederationPage from './pages/FederationPage';
import MessagesPage from './pages/MessagesPage';
import CreateCommunityModal from './components/CreateCommunityModal';
import { WebSocketProvider } from './context/WebSocketContext';
import { ThemeProvider } from './context/ThemeContext';

/**
 * Main Application Component
 * 
 * Functionality: Handles routing, authentication checks, and global loading states.
 * Input: None
 * Response: JSX.Element - The rendered application with appropriate routes.
 */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [showCommunityModal, setShowCommunityModal] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('graphene_token');
      setIsAuthenticated(!!token);
    };

    checkAuth();
    setLoading(false);

    // Listen for storage changes (for cross-tab sync)
    window.addEventListener('storage', checkAuth);

    // Listen for custom auth events (for same-tab updates)
    window.addEventListener('authChange', checkAuth);

    // Global event so any page's Header button can open this modal
    const openModal = () => setShowCommunityModal(true);
    window.addEventListener('openCreateCommunity', openModal);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
      window.removeEventListener('openCreateCommunity', openModal);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
        <div className="text-2xl font-black">Loading...</div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <WebSocketProvider>
        <CreateCommunityModal
          isOpen={showCommunityModal}
          onClose={() => setShowCommunityModal(false)}
          onSuccess={() => setShowCommunityModal(false)}
        />
        <Routes>
          {/* ... existing routes ... */}
          <Route path="/welcome" element={<LandingPage />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
          />
          <Route
            path="/recovery"
            element={isAuthenticated ? <Navigate to="/" replace /> : <RecoveryPage />}
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={isAuthenticated ? <HomePage /> : <LandingPage />}
          />
          <Route
            path="/submit"
            element={isAuthenticated ? <CreatePostPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/profile"
            element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/my-posts"
            element={isAuthenticated ? <MyPostsPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/search"
            element={isAuthenticated ? <SearchPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/r/:name"
            element={isAuthenticated ? <CommunityPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/r/:name/:postId/:slug"
            element={isAuthenticated ? <PostDetailsPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/about"
            element={isAuthenticated ? <AboutPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/federation"
            element={isAuthenticated ? <FederationPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/messages"
            element={isAuthenticated ? <MessagesPage /> : <Navigate to="/login" replace />}
          />

          {/* Catch all - redirect to home or landing */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </WebSocketProvider>
    </ThemeProvider>
  );
}

export default App;
