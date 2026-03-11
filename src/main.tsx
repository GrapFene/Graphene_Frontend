import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';

/**
 * Application Entry Point
 * 
 * Functionality: Mounts the React application to the DOM, dealing with theme provider, and router.
 */
createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ThemeProvider>
);
