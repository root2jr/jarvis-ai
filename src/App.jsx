import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import bgVideo from './bg.mp4';
import './App.css';
import Threed from './Threed';
import Particles from './Particles';
import ShinyText from './ShinyText';
import Loginpage from './Loginpage';
import AiPage from './AiPage';
import ProtectedRoute from './ProtectedRoute';
import Forgotpassword from './Forgotpassword';
import { useEffect } from 'react';

function Lander() {
  const navigate = useNavigate();


  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/ai');
    }
  }, [])

  const video = document.createElement('video');
  video.src = './bg.mp4';
  video.preload = 'auto';
  video.load();  


  return (
    <div className="lander">
      <video autoPlay loop muted>
        <source src={bgVideo} type='video/mp4' />
      </video>
      <div className="bg-2">
        <div style={{ width: '100%', height: '600px', position: 'absolute', pointerEvents: 'none' }}>
          <Particles
            particleColors={['#ffffff', '#ffffff']}
            particleCount={200}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        </div>

        <nav><h1>JARVIS AI</h1></nav>
        <Threed />
        <div onClick={() => navigate('/login')} className="batton">
          <ShinyText text="JARVIS AI" disabled={false} speed={3} className="custom-class" />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lander />} />
        <Route path="/login" element={<Loginpage />} />
        <Route
          path="/ai"
          element={
            <ProtectedRoute>
              <AiPage />
            </ProtectedRoute>
          }
        />
        <Route path='/forgotpassword' element={<Forgotpassword />} />

      </Routes>
    </Router>
  );
}

export default App;
