import React from 'react';
import Login from './components/Login';
import backgroundImage from './assets/background.png';

function App() {
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
        <Login />
      </div>
    </div>
  );
}

export default App;
