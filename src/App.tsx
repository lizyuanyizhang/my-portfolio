import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Timeline } from './pages/Timeline';
import { Resume } from './pages/Resume';
import { Essays } from './pages/Essays';
import { EssayDetail } from './pages/EssayDetail';
import { Photography } from './pages/Photography';
import { Apps } from './pages/Apps';
import { Audio } from './pages/Audio';
import { Video } from './pages/Video';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={
                <motion.div
                  key="home"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Home />
                </motion.div>
              } />
              <Route path="/timeline" element={
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Timeline />
                </motion.div>
              } />
              <Route path="/resume" element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Resume />
                </motion.div>
              } />
              <Route path="/essays" element={
                <motion.div key="essays" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                  <Essays />
                </motion.div>
              } />
              <Route path="/essays/:id" element={
                <motion.div key="essay-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                  <EssayDetail />
                </motion.div>
              } />
              <Route path="/photography" element={
                <motion.div key="photography" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                  <Photography />
                </motion.div>
              } />
              <Route path="/apps" element={
                <motion.div key="apps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                  <Apps />
                </motion.div>
              } />
              <Route path="/audio" element={
                <motion.div key="audio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                  <Audio />
                </motion.div>
              } />
              <Route path="/video" element={
                <motion.div key="video" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                  <Video />
                </motion.div>
              } />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
}
