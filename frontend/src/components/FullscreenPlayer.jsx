import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, 
  Volume2, VolumeX, Heart, ChevronDown, MoreHorizontal, Plus, Share2
} from 'lucide-react';
import { 
  selectPlayer, togglePlay, nextSong, prevSong, 
  setVolume, setExpanded, toggleShuffle, cycleRepeat,
  toggleMute
} from '../store/slices/playerSlice';
import { useToggleLikeSongMutation } from '../store/services/musicApi';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Link } from 'react-router-dom';
import CoverImage from './CoverImage';

const fmt = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

export default function FullscreenPlayer({ 
  currentSong, isPlaying, volume, isMuted, shuffle, repeat, 
  currentTime, duration, handleSeek 
}) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const [toggleLike] = useToggleLikeSongMutation();
  
  if (!currentSong) return null;

  const isLiked = currentSong.likedBy?.includes(currentUser?._id);

  const handleLike = async () => {
    if (!currentUser) return;
    try {
      await toggleLike(currentSong._id).unwrap();
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };
  const cover = currentSong.album?.coverImage || currentSong.coverImage;
  const progressPct = duration ? (currentTime / duration) * 100 : 0;
  const handleSeekInternal = (e) => {
    const audio = document.getElementById('main-audio');
    if (audio) {
      const pct = e.target.value / 100;
      audio.currentTime = pct * duration;
    }
  };

  const VolIcon = isMuted || volume === 0 ? VolumeX : volume < 0.4 ? Volume2 : Volume2;

  return (
    <motion.div 
      className="fullscreen-player"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      {/* ── Background Atmosphere ── */}
      {cover ? (
        <div className="fs-player-bg" style={{ backgroundImage: `url(${cover})` }} />
      ) : (
        <div className="fs-player-bg no-image" />
      )}
      <div className="fs-player-overlay" />
      
      <div className="fs-player-content">
        {/* ── Top Bar ── */}
        <header className="fs-player-header">
          <button className="fs-close-btn" onClick={() => dispatch(setExpanded(false))}>
            <ChevronDown size={28} />
          </button>
          <div className="fs-header-meta">
            <span className="fs-playing-from">NOW PLAYING</span>
            <span className="fs-album-name">{currentSong.album?.title || 'Single'}</span>
          </div>
          <button className="icon-btn-fs">
            <MoreHorizontal size={24} />
          </button>
        </header>

        <div className="fs-player-main">
          {/* ── Large Album Art ── */}
          <div className={`fs-art-container ${isPlaying ? 'is-spinning' : ''}`}>
            <div className={`fs-art-wrapper ${isPlaying ? 'spinning' : ''}`}>
              <CoverImage 
                src={cover} 
                alt={currentSong.title} 
                size="100%" 
                rounded="lg" 
                className="fs-art" 
              />
            </div>
          </div>

          <div className="fs-controls-section">
            {/* ── Meta Info ── */}
            <div className="fs-info-row">
              <div className="fs-meta">
                <h1 className="fs-song-title">{currentSong.title}</h1>
                <Link 
                  to={`/artist/${currentSong.createdBy?._id || currentSong.createdBy}`}
                  className="fs-artist-name hover-underline"
                  onClick={() => dispatch(setExpanded(false))}
                >
                  {currentSong.artist || currentSong.album?.artist || 'Unknown Artist'}
                </Link>
              </div>
              <button 
                className={`fs-heart-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
              >
                <Heart size={28} strokeWidth={1.5} fill={isLiked ? 'var(--accent)' : 'none'} color={isLiked ? 'var(--accent)' : 'currentColor'} />
              </button>
            </div>

            {/* ── Progress Section ── */}
            <div className="fs-progress-wrapper">
              <div className="progress-slider-wrapper fs-slider">
                <input
                  type="range"
                  className="progress-slider"
                  value={progressPct}
                  onChange={handleSeekInternal}
                  step="0.1"
                />
                <div className="progress-slider-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="fs-time-row">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* ── Playback Controls ── */}
            <div className="fs-playback-controls">
              <button 
                className={`fs-icon-btn ${shuffle ? 'active' : ''}`}
                onClick={() => dispatch(toggleShuffle())}
              >
                <Shuffle size={22} />
              </button>
              <button className="fs-skip-btn" onClick={() => dispatch(prevSong())}>
                <SkipBack size={36} fill="currentColor" />
              </button>
              <button className="fs-play-btn" onClick={() => dispatch(togglePlay())}>
                {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" style={{ marginLeft: 6 }} />}
              </button>
              <button className="fs-skip-btn" onClick={() => dispatch(nextSong())}>
                <SkipForward size={36} fill="currentColor" />
              </button>
              <button 
                className={`fs-icon-btn ${repeat !== 'off' ? 'active' : ''}`}
                onClick={() => dispatch(cycleRepeat())}
              >
                <Repeat size={22} />
                {repeat === 'one' && <span className="repeat-badge-fs">1</span>}
              </button>
            </div>

            {/* ── Footer Row ── */}
            <footer className="fs-footer-controls">
              <div className="fs-volume-row">
                <button className="fs-icon-btn" onClick={() => dispatch(toggleMute())}>
                  <VolIcon size={20} />
                </button>
                <div className="fs-vol-slider-container">
                  <input
                    type="range"
                    className="volume-slider"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => dispatch(setVolume(parseFloat(e.target.value)))}
                  />
                </div>
              </div>
              <div className="fs-footer-actions">
                <button className="fs-icon-btn"><Plus size={20} /></button>
                <button className="fs-icon-btn"><Share2 size={20} /></button>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
