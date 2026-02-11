import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import CreatePostPage from './pages/CreatePostPage';
import CommunityPage from './pages/CommunityPage';
import PostDetailsPage from './pages/PostDetailsPage';
import SearchPage from './pages/SearchPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

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

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
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
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />}
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

      {/* Catch all - redirect to home or login */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
      />
    </Routes>
  );
}

export default App;
