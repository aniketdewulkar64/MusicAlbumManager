import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Disc3, Home, Compass, Library, ListMusic, Heart,
  LogOut, User, Search, ChevronDown,
} from 'lucide-react';
import { selectCurrentUser, selectUserRole, logout } from '../store/slices/authSlice';
import { useGetProfileQuery, musicApi } from '../store/services/musicApi';
import { 
  selectPlayer, 
  setExpanded 
} from '../store/slices/playerSlice';
import api from '../services/api';
import { toast } from 'react-toastify';
import logo from '../assets/melodia.png';
import MusicPlayer from './MusicPlayer';
import FullscreenPlayer from './FullscreenPlayer';
import AudioEngine from './AudioEngine';

const NAV_MAIN = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/albums', icon: Compass, label: 'Explore' },
  { to: '/playlists', icon: Library, label: 'Playlists' },
];
const NAV_USER = [
  { to: '/profile', icon: User, label: 'Profile', requireAuth: true },
];
const NAV_ADMIN = [
  { to: '/admin', icon: Disc3, label: 'Admin Panel', requireRole: 'admin' },
];
const NAV_ARTIST = [
  { to: '/creator', icon: Disc3, label: 'Creator Hub', requireRole: 'artist' },
];

export default function Layout() {
  const user = useSelector(selectCurrentUser);
  const role = useSelector(selectUserRole);
  const { data: profileData, error: profileError } = useGetProfileQuery(undefined, { skip: !user });
  const userData = profileData?.data || user;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { 
    currentSong, isPlaying, volume, isMuted, 
    shuffle, repeat, isExpanded, currentTime, duration 
  } = useSelector(selectPlayer);

  const [search, setSearch] = useState('');

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    dispatch(logout());
    dispatch(musicApi.util.resetApiState());
    navigate('/login');
    toast.info('Signed out');
  };

  useEffect(() => {
    if (profileError && profileError.status === 401) {
      dispatch(logout());
      dispatch(musicApi.util.resetApiState());
    }
  }, [profileError, dispatch]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const renderNav = (items) =>
    items
      .filter((item) => {
        if (item.requireAuth && !user) return false;
        if (item.requireRole && role !== item.requireRole) return false;
        return true;
      })
      .map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Icon size={18} strokeWidth={1.5} />
          <span>{label}</span>
        </NavLink>
      ));

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="logo">
          <img src={logo} alt="logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span className="logo-text">Melodia</span>
        </div>

        <p className="sidebar-section-label">Discover</p>
        {renderNav(NAV_MAIN)}

        {userData && (
          <>
            <p className="sidebar-section-label" style={{ marginTop: 24 }}>Your Library</p>
            {renderNav([{ to: '/favorites', icon: Heart, label: 'Favorites', requireAuth: true }])}
            
            {userData.following?.length > 0 && (
              <>
                <p className="sidebar-section-label" style={{ marginTop: 16 }}>Following</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
                  {userData.following.slice(0, 5).map(artist => (
                    <NavLink key={artist._id} to={`/artist/${artist._id}`} className="nav-item" style={{ padding: '6px 8px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--glass-2)', overflow: 'hidden', flexShrink: 0 }}>
                        {artist.avatar ? <img src={artist.avatar} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={12} style={{ margin: 5 }} />}
                      </div>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist.artistName}</span>
                    </NavLink>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {(role === 'admin' || role === 'artist') && (
          <>
            <div className="sidebar-divider" style={{ margin: '20px 16px' }} />
            <p className="sidebar-section-label">Management</p>
            {role === 'admin' && renderNav(NAV_ADMIN)}
            {role === 'artist' && renderNav(NAV_ARTIST)}
          </>
        )}

        <div className="sidebar-divider" style={{ margin: '20px 16px' }} />
        {renderNav(NAV_USER)}

      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-search">
            <Search size={15} color="var(--text-muted)" strokeWidth={1.5} />
            <input
              placeholder="Search albums, artists, songs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
            />
            <kbd>⏎</kbd>
          </div>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button 
                className="user-menu-btn" 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--glass-2)',
                  border: '1px solid var(--glass-border)',
                  padding: '4px 8px 4px 4px',
                  borderRadius: '32px',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000' }}>
                  {userData?.avatar ? <img src={userData.avatar} alt="v" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
                <ChevronDown size={14} style={{ transform: isUserMenuOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 998 }} 
                      onClick={() => setIsUserMenuOpen(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        width: '200px',
                        background: 'rgba(25, 25, 25, 0.95)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        padding: '4px',
                        zIndex: 999,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                      }}
                    >
                      <button 
                        className="menu-item" 
                        onClick={() => { navigate('/profile'); setIsUserMenuOpen(false); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px', fontSize: 13 }}
                      >
                        <User size={16} strokeWidth={1.5} /> Account
                      </button>
                      <button 
                        className="menu-item" 
                        onClick={() => { navigate('/favorites'); setIsUserMenuOpen(false); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px', fontSize: 13 }}
                      >
                        <Heart size={16} strokeWidth={1.5} /> Favorites
                      </button>
                      {role === 'admin' && (
                        <button 
                          className="menu-item" 
                          onClick={() => { navigate('/admin'); setIsUserMenuOpen(false); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px', fontSize: 13 }}
                        >
                          <Disc3 size={16} strokeWidth={1.5} /> Admin Panel
                        </button>
                      )}
                      {role === 'artist' && (
                        <button 
                          className="menu-item" 
                          onClick={() => { navigate('/creator'); setIsUserMenuOpen(false); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px', fontSize: 13 }}
                        >
                          <Disc3 size={16} strokeWidth={1.5} /> Creator Hub
                        </button>
                      )}
                      <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />
                      <button 
                        className="menu-item" 
                        onClick={handleLogout}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: 'none', color: 'var(--error)', cursor: 'pointer', borderRadius: '4px', fontSize: 13 }}
                      >
                        <LogOut size={16} strokeWidth={1.5} /> Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <NavLink to="/login" className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>Sign In</NavLink>
          )}
        </header>

        {/* Page */}
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }}
            className="page-wrapper"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Player Components */}
      <AudioEngine />
      <MusicPlayer />
      
      <AnimatePresence>
        {isExpanded && currentSong && (
          <FullscreenPlayer 
            currentSong={currentSong}
            isPlaying={isPlaying}
            volume={volume}
            isMuted={isMuted}
            shuffle={shuffle}
            repeat={repeat}
            currentTime={currentTime}
            duration={duration}
            handleSeek={(e) => {
              const audio = document.getElementById('main-audio');
              if (audio) {
                const pct = e.target.value / 100;
                audio.currentTime = pct * duration;
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        <NavLink to="/" end className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              <Home size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>Home</span>
            </>
          )}
        </NavLink>
        <NavLink to="/albums" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              <Compass size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>Explore</span>
            </>
          )}
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              <Search size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>Search</span>
            </>
          )}
        </NavLink>
        <NavLink to="/playlists" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              <Library size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>Library</span>
            </>
          )}
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              <User size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>Profile</span>
            </>
          )}
        </NavLink>
        {role === 'artist' && (
          <NavLink to="/creator" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
            {({ isActive }) => (
              <>
                <Disc3 size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span>Creator</span>
              </>
            )}
          </NavLink>
        )}
      </nav>
    </div>
  );
}


