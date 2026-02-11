import { useState, useEffect } from 'react';
import Header from './components/Header';
import PostCard from './components/PostCard';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import AuthPage from './components/AuthPage'; // Import AuthPage
import ProfilePage from './components/ProfilePage'; // Import ProfilePage
import { posts } from './data/mockData';
import backgroundImage from './assets/background.png'; // Import background image

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'feed' | 'profile'>('feed');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('graphene_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div style={{
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100vw',
        height: '100vh',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(5, 5, 5, 0.7)', // Overlay for better readability
          zIndex: 1
        }}>
          <AuthPage onLoginSuccess={() => setIsAuthenticated(true)} />
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('graphene_token');
    localStorage.removeItem('graphene_user');
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {currentView === 'feed' ? (
              <>
                <FilterBar />
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </>
            ) : (
              <ProfilePage onBack={() => setCurrentView('feed')} />
            )}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24">
              <Sidebar onLogout={handleLogout} onProfileClick={() => setCurrentView('profile')} />
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-black text-white border-t-4 border-black mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-black text-lg mb-3">About</h4>
              <ul className="space-y-2 font-bold">
                <li><a href="#" className="hover:text-yellow-300">About Us</a></li>
                <li><a href="#" className="hover:text-yellow-300">Careers</a></li>
                <li><a href="#" className="hover:text-yellow-300">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-lg mb-3">Community</h4>
              <ul className="space-y-2 font-bold">
                <li><a href="#" className="hover:text-yellow-300">Guidelines</a></li>
                <li><a href="#" className="hover:text-yellow-300">Help</a></li>
                <li><a href="#" className="hover:text-yellow-300">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-lg mb-3">Legal</h4>
              <ul className="space-y-2 font-bold">
                <li><a href="#" className="hover:text-yellow-300">Privacy</a></li>
                <li><a href="#" className="hover:text-yellow-300">Terms</a></li>
                <li><a href="#" className="hover:text-yellow-300">Cookie Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-lg mb-3">Follow</h4>
              <ul className="space-y-2 font-bold">
                <li><a href="#" className="hover:text-yellow-300">Twitter</a></li>
                <li><a href="#" className="hover:text-yellow-300">Discord</a></li>
                <li><a href="#" className="hover:text-yellow-300">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t-2 border-white text-center font-black">
            <p>GrapFene © 2024 - Brutally Honest Social Media</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
