import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ChevronRight, Star, Heart } from 'lucide-react';
import { 
  useGetTrendingAlbumsQuery, 
  useGetTopSongsQuery, 
  useGetAlbumsQuery,
  useToggleLikeSongMutation 
} from '../store/services/musicApi';
import { useSelector, useDispatch } from 'react-redux';
import { playSong, selectPlayer } from '../store/slices/playerSlice';
import { selectCurrentUser } from '../store/slices/authSlice';
import CoverImage from '../components/CoverImage';
import Equalizer from '../components/Equalizer';

const GENRES = ['All', 'Pop', 'Rock', 'Jazz', 'Hip-Hop', 'Classical', 'Electronic', 'R&B', 'Country', 'Metal', 'Other'];

const container = { animate: { transition: { staggerChildren: 0.06 } } };
const item = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

function AlbumCard({ album, queue }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <motion.div variants={item} className="album-card" onClick={() => navigate(`/albums/${album._id}`)}>
      <div className="album-card-art">
        <CoverImage src={album.coverImage} alt={album.title} size="100%" />
        <div className="album-card-overlay">
          <button
            className="play-btn-circle"
            onClick={(e) => { 
              e.stopPropagation(); 
              dispatch(playSong({ song: album, queue: queue || [album] })); 
            }}
          >
            <Play size={18} strokeWidth={2} fill="currentColor" />
          </button>
        </div>
      </div>
      <div className="album-card-title">{album.title}</div>
      <div className="album-card-artist">{album.artist}</div>
      <div className="album-card-meta">
        <span>{album.releaseYear}</span>
        {album.avgRating > 0 && (
          <>
            <span>·</span>
            <Star size={10} strokeWidth={1.5} fill="var(--warning)" color="var(--warning)" />
            <span>{album.avgRating.toFixed(1)}</span>
          </>
        )}
      </div>
    </motion.div>
  );
}

function HeroSong({ song, queue }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!song) return null;

  const artistId = song.createdBy?._id || song.createdBy;
  const cover = song.coverImage || song.album?.coverImage;

  return (
    <div 
      className="hero-song-v2 glass-elevated" 
      style={{ 
        position: 'relative',
        margin: '16px 20px 0',
        height: '200px',
        borderRadius: '24px',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        alignItems: 'center',
        padding: '0 32px',
        gap: '32px',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08)'
      }}
    >
      {/* 1. Dynamic Ambient Background */}
      <div style={{ 
        position: 'absolute', inset: 0, 
        backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(100px) brightness(0.4) saturate(2.5)', zIndex: 0,
        transform: 'scale(1.3)'
      }} />
      <div style={{ 
        position: 'absolute', inset: 0, 
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)', 
        zIndex: 1 
      }} />

      {/* 2. Left: Square Image */}
      <div className="hero-song-art-container" style={{ position: 'relative', zIndex: 2, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <CoverImage 
          src={cover} 
          alt={song.title} 
          rounded="lg" 
          className="hero-song-art-final" 
        />
      </div>

      {/* 3. Right: Content */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ 
            fontSize: '11px', fontWeight: 900, color: 'var(--accent)', 
            letterSpacing: '0.15em', textTransform: 'uppercase',
            textShadow: '0 0 20px var(--accent-glow)'
          }}>
            🔥 #1 Trending
          </span>
          <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700, opacity: 0.9 }}>❤ {song.likes || 0} likes</span>
        </div>

        <h1 style={{ 
          fontSize: '36px', fontWeight: 900, color: '#ffffff', 
          margin: '0', letterSpacing: '-0.02em', lineHeight: 1.1,
          textShadow: '0 2px 10px rgba(0,0,0,0.5)'
        }}>
          {song.title}
        </h1>

        <div style={{ marginBottom: '18px' }}>
          <Link 
            to={`/artist/${artistId}`}
            className="hover-underline"
            style={{ 
              fontSize: '16px', color: '#ffffff', fontWeight: 700, 
              textDecoration: 'none', display: 'inline-block',
              opacity: 0.95
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {song.artist || song.album?.artist || 'Unknown Artist'}
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            className="btn-primary" 
            style={{ 
              padding: '0 32px', height: '40px', borderRadius: '20px', 
              fontSize: '14px', fontWeight: 800,
              boxShadow: '0 10px 30px var(--accent-glow)' 
            }}
            onClick={() => dispatch(playSong({ song, queue }))}
          >
            Listen Now
          </button>
        </div>
      </div>
    </div>
  );
}

const fmt = (s) => { if (!s) return '—'; const m = Math.floor(s / 60); return `${m}:${(s % 60).toString().padStart(2, '0')}`; };

export default function Home() {
  const dispatch = useDispatch();
  const { currentSong } = useSelector(selectPlayer);
  const currentUser = useSelector(selectCurrentUser);
  const [toggleLike] = useToggleLikeSongMutation();
  const [selectedGenre, setSelectedGenre] = useState('All');
  const { data: trendingData, isLoading: trendingLoading } = useGetTrendingAlbumsQuery();
  const { data: topSongsData, isLoading: songsLoading } = useGetTopSongsQuery();
  const { data: albumsData, isLoading: albumsLoading } = useGetAlbumsQuery(
    selectedGenre !== 'All' ? { genre: selectedGenre, limit: 12 } : { limit: 12 }
  );

  const trending = trendingData?.data || [];
  const topSongs = topSongsData?.data || [];
  const albums = albumsData?.data || [];
  const heroSong = topSongs[0];

  return (
    <div>
      {/* Hero */}
      {songsLoading
        ? <div className="hero-song skeleton" style={{ height: 220, margin: '28px 32px' }} />
        : <HeroSong song={heroSong} queue={topSongs} />
      }

      {/* Genre chips */}
      <div className="chip-row" style={{ marginTop: 20 }}>
        {GENRES.map((g) => (
          <button key={g} className={`chip${selectedGenre === g ? ' active' : ''}`} onClick={() => setSelectedGenre(g)}>
            {g}
          </button>
        ))}
      </div>

      {/* Trending */}
      <div className="section-header">
        <h2 className="section-title">Trending Albums</h2>
        <Link to="/albums" className="see-all-btn">See all <ChevronRight size={14} strokeWidth={1.5} /></Link>
      </div>
      <motion.div className="albums-grid" variants={container} initial="initial" animate="animate">
        {trendingLoading
          ? [...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200 }} />)
          : (trending.length > 0 ? trending.slice(0, 6) : albums.slice(0, 6)).map((a) => (
              <AlbumCard key={a._id} album={a} queue={trending} />
            ))}
      </motion.div>

      {/* Top Songs */}
      <div className="section-header" style={{ marginTop: 16 }}>
        <h2 className="section-title">Top Songs</h2>
      </div>
      <div className="home-tracks-wrapper">
        <div className="panel">
          {songsLoading ? <div className="spinner" /> : topSongs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No songs yet.</p>
          ) : topSongs.map((song, i) => {
            const isPlaying = currentSong?._id === song._id;
            return (
              <div 
                key={song._id} 
                className={`track-row ${isPlaying ? 'active-track' : ''}`} 
                onClick={() => dispatch(playSong({ song, queue: topSongs, index: i }))}
              >
                <div className="track-num">
                  {isPlaying ? <Equalizer isPlayingRow={true} /> : i + 1}
                </div>
                <div>
                  <div className="track-title" style={{ color: isPlaying ? 'var(--accent)' : 'inherit' }}>{song.title}</div>
                  <Link 
                    to={`/artist/${song.createdBy?._id || song.createdBy}`}
                    className="track-artist-small hover-underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {song.artist || song.album?.artist}
                  </Link>
                </div>
                <div className="track-likes" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                   <button 
                     className="icon-btn" 
                     onClick={(e) => {
                       e.stopPropagation();
                       if (song._id) toggleLike(song._id);
                     }}
                   >
                     <Heart size={14} fill={song.likedBy?.includes(currentUser?._id) ? 'var(--accent)' : 'none'} color={song.likedBy?.includes(currentUser?._id) ? 'var(--accent)' : 'currentColor'} />
                   </button>
                   <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{song.likes || 0}</span>
                </div>
                <div className="track-plays">{song.playCount?.toLocaleString()}</div>
                <div className="track-duration">{fmt(song.duration)}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ height: 32 }} />
    </div>
  );
}
