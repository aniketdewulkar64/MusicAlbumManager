import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, 
  Volume2, VolumeX, Heart, ChevronUp, ListMusic 
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

export default function MusicPlayer() {
  const dispatch = useDispatch();
  const { 
    currentSong, isPlaying, volume, isMuted, 
    shuffle, repeat, isExpanded, isVisible,
    currentTime, duration
  } = useSelector(selectPlayer);
  const currentUser = useSelector(selectCurrentUser);
  const [toggleLike] = useToggleLikeSongMutation();

  if (!isVisible || !currentSong) return null;

  const isLiked = currentSong.likedBy?.includes(currentUser?._id);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      await toggleLike(currentSong._id).unwrap();
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e) => {
    const audio = document.getElementById('main-audio');
    if (audio) {
      const pct = e.target.value / 100;
      audio.currentTime = pct * duration;
    }
  };

  const VolIcon = isMuted || volume === 0 ? VolumeX : volume < 0.4 ? Volume2 : Volume2;

  return (
    <div className="player-bar">
      {/* ── Left — Track Info ── */}
      <div className="player-track-info" onClick={() => dispatch(setExpanded(true))}>
        <div className="player-thumb-container">
          <CoverImage 
            src={currentSong.album?.coverImage || currentSong.coverImage} 
            alt={currentSong.title} 
            size={44} 
            rounded="sm" 
            className="player-thumb"
          />
        </div>
        <div className="player-meta">
          <div className="player-song-name">{currentSong.title}</div>
          <Link 
            to={`/artist/${currentSong.createdBy?._id || currentSong.createdBy}`} 
            className="player-artist-name hover-underline"
            onClick={(e) => e.stopPropagation()}
          >
            {currentSong.artist || currentSong.album?.artist || 'Unknown Artist'}
          </Link>
        </div>
        <button 
          className={`icon-btn heart-btn ${isLiked ? 'liked' : ''}`} 
          onClick={handleLike}
        >
          <Heart size={16} strokeWidth={1.5} fill={isLiked ? 'var(--accent)' : 'none'} color={isLiked ? 'var(--accent)' : 'currentColor'} />
        </button>
      </div>

      {/* ── Center — Controls + Progress ── */}
      <div className="player-center">
        <div className="player-controls">
          <button className="icon-btn" onClick={() => dispatch(prevSong())}>
            <SkipBack size={20} fill="currentColor" />
          </button>
          <button className="player-play-main" onClick={() => dispatch(togglePlay())}>
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />}
          </button>
          <button className="icon-btn" onClick={() => dispatch(nextSong())}>
            <SkipForward size={20} fill="currentColor" />
          </button>
        </div>

        <div className="player-progress-container">
          <span className="player-time">{fmt(currentTime)}</span>
          <div className="progress-slider-wrapper">
            <input
              type="range"
              className="progress-slider"
              value={progressPct}
              onChange={handleSeek}
              step="0.1"
            />
            <div className="progress-slider-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="player-time">{fmt(duration)}</span>
        </div>
      </div>

      {/* ── Right — Extra Controls ── */}
      <div className="player-right">
        {/* Mobile-only: show skip + play controls since center is hidden */}
        <button className="icon-btn player-mobile-prev" onClick={() => dispatch(prevSong())}>
          <SkipBack size={18} fill="currentColor" />
        </button>
        <button className="player-play-main player-mobile-play" onClick={() => dispatch(togglePlay())}>
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: 1 }} />}
        </button>
        <button className="icon-btn player-mobile-next" onClick={() => dispatch(nextSong())}>
          <SkipForward size={18} fill="currentColor" />
        </button>

        {/* Desktop-only extras */}
        <button 
          className={`icon-btn player-desktop-extra ${shuffle ? 'active' : ''}`} 
          onClick={() => dispatch(toggleShuffle())}
          title="Shuffle"
        >
          <Shuffle size={14} />
        </button>
        <button 
          className={`icon-btn player-desktop-extra ${repeat !== 'off' ? 'active' : ''}`} 
          onClick={() => dispatch(cycleRepeat())}
          title={`Repeat: ${repeat}`}
        >
          <Repeat size={14} />
          {repeat === 'one' && <span className="repeat-badge">1</span>}
        </button>
        
        <div className="player-volume-container">
          <button className="icon-btn vol-btn" onClick={() => dispatch(toggleMute())}>
            <VolIcon size={16} strokeWidth={1.5} />
          </button>
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

        <button className="icon-btn player-desktop-extra" onClick={() => dispatch(setExpanded(true))} title="Expand">
          <ChevronUp size={18} />
        </button>
      </div>

    </div>
  );
}
