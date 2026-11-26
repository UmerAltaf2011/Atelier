import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useApp } from '../store.jsx';
import { timeAgo } from '../lib/format.js';
import Nav from './Nav.jsx';
import ChatDrawer from './ChatDrawer.jsx';
import ProductModal from './ProductModal.jsx';
import CurrencyDialog from './CurrencyDialog.jsx';
import { CursorBlob, Preloader, StreetBackdrop } from './fx.jsx';

function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return <motion.div className="scroll-bar" style={{ scaleX }} />;
}

function Footer() {
  const { rates, saveStatus, online, user } = useApp();
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <div className="logo big">ATELIER<span>.</span></div>
          <p className="footer-tag">Streetwear that knows your block, your weather and your currency.</p>
        </div>
        <div className="footer-cols">
          <div><h4>Explore</h4><Link to="/shop">Discover</Link><Link to="/brands">Brands</Link><Link to="/quiz">Style quiz</Link></div>
          <div><h4>Yours</h4><Link to="/wardrobe">Wardrobe</Link><Link to="/account">Account</Link><Link to="/about">How it works</Link></div>
        </div>
      </div>
      <div className="footer-bottom">
        <span className="status"><i className={online ? 'ok' : 'off'}></i>{online ? 'Connected' : 'Offline mode'}</span>
        <span>FX {rates.live ? 'live' : 'cached'} · {Object.keys(rates.rates).length} currencies</span>
        <span>{user?.guest === false ? 'Synced to your account' : 'Auto-saved as guest'}: {saveStatus.state === 'saving' ? 'saving…' : timeAgo(saveStatus.at)}</span>
        <span>© 2026 Atelier</span>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { pathname, hash } = useLocation();
  const { toastState, openChat, chat } = useApp();

  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView(), 60);
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return (
    <>
      <Preloader />
      <StreetBackdrop />
      <CursorBlob />
      <ScrollBar />
      <div className="grain" aria-hidden="true"></div>
      <motion.div key={`wipe-${pathname}`} className="wipe" initial={{ scaleY: 1 }} animate={{ scaleY: 0 }} transition={{ duration: 0.75, delay: 0.1, ease: [0.76, 0, 0.24, 1] }} aria-hidden="true" />
      <Nav />
      <AnimatePresence mode="wait">
        <motion.main key={pathname} className="page" initial={{ opacity: 0, y: 40, skewY: 1.5 }} animate={{ opacity: 1, y: 0, skewY: 0 }} exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}>
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
      {!chat.open && (
        <motion.button className="fab" onClick={() => openChat()} aria-label="Open AI stylist"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: 'spring' }} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
          <Sparkles size={22} /><span className="fab-ring"></span>
        </motion.button>
      )}
      <ChatDrawer />
      <ProductModal />
      <CurrencyDialog />
      <div className={`toast${toastState.show ? ' show' : ''}`} role="status" aria-live="polite">{toastState.msg}</div>
    </>
  );
}
