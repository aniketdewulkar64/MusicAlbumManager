import { useSearchParams, Link } from 'react-router-dom';
import { useUnifiedSearchQuery } from '../store/services/musicApi';
import { Music, Disc3, User, Search as SearchIcon, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { playSong, selectPlayer, setExpanded } from '../store/slices/playerSlice';
import CoverImage from '../components/CoverImage';
import Equalizer from '../components/Equalizer';

const SectionHeader = ({ title, icon: Icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '32px 0 16px', padding: '0 32px' }}>
    <Icon size={20} color="var(--accent)" strokeWidth={1.5} />
    <h2 style={{ fontSize: 20, fontWeight: 500, fontFamily: 'var(--font-display)' }}>{title}</h2>
  </div>
);

export default function SearchPage() {
  const dispatch = useDispatch();
  const { currentSong } = useSelector(selectPlayer);
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { data, isLoading } = useUnifiedSearchQuery(query, { skip: !query });

  const results = data?.data || { albums: [], songs: [], artists: [] };

  if (isLoading) return <div className="spinner" />;

  if (!query) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-dim)' }}>
        <SearchIcon size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
        <p>Type something to search for music, artists or albums</p>
      </div>
    );
  }

  const hasResults = results.albums.length > 0 || results.songs.length > 0 || results.artists.length > 0;

  if (!hasResults) {
    return (
      <div className="page-inner" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <h1 style={{ fontSize: 24, fontWeight: 400 }}>No results found for "{query}"</h1>
        <p style={{ color: 'var(--text-dim)', marginTop: 8 }}>Try searching for something else</p>
      </div>
    );
  }

  const fmt = (s) => { if (!s) return '0:00'; const m = Math.floor(s/60); const sec = (s%60).toString().padStart(2,'0'); return `${m}:${sec}`; };

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="home-tracks-wrapper" style={{ paddingTop: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 400 }}>Search results for "{query}"</h1>
      </div>

      {/* Artists Section */}
      {results.artists.length > 0 && (
        <>
          <SectionHeader title="Artists" icon={User} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: '0 32px' }}>
            {results.artists.map(artist => (
              <motion.div 
                key={artist._id}
                whileHover={{ y: -4 }}
                style={{ width: 160, textAlign: 'center' }}
              >
                <Link to={`/artist/${artist._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'var(--glass-2)', marginBottom: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                    {artist.avatar ? <img src={artist.avatar} alt="v" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={48} style={{ margin: 56, opacity: 0.2 }} />}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{artist.artistName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Artist</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Songs Section */}
      {results.songs.length > 0 && (
        <>
          <SectionHeader title="Songs" icon={Music} />
          <div className="home-tracks-wrapper">
            <div className="panel" style={{ padding: 8 }}>
              {results.songs.map((song, i) => {
                const isPlaying = currentSong?._id === song._id;
                return (
                  <div 
                    key={song._id} 
                    className={`track-row ${isPlaying ? 'active-track' : ''}`}
                    onClick={() => {
                      if (isPlaying) {
                        dispatch(setExpanded(true));
                      } else {
                        dispatch(playSong({ song, queue: results.songs, index: i }));
                      }
                    }}
                  >
                    <div className="track-num">
                      {isPlaying ? <Equalizer isPlayingRow={true} /> : i + 1}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <CoverImage src={song.album?.coverImage || song.coverImage} size={40} rounded="sm" />
                      <div>
                        <div className="track-title" style={{ color: isPlaying ? 'var(--accent)' : 'inherit' }}>{song.title}</div>
                        <div className="track-artist-small">{song.artist?.artistName || song.album?.artist || 'Unknown Artist'}</div>
                      </div>
                    </div>
                    <div className="track-duration">{fmt(song.duration)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Albums Section */}
      {results.albums.length > 0 && (
        <>
          <SectionHeader title="Albums" icon={Disc3} />
          <div className="albums-grid">
            {results.albums.map(album => (
              <Link key={album._id} to={`/albums/${album._id}`} className="album-card">
                 <div className="album-art-wrap">
                   <CoverImage src={album.coverImage} alt={album.title} size="100%" />
                 </div>
                 <div className="album-info">
                   <div className="album-title">{album.title}</div>
                   <div className="album-artist">{album.artist}</div>
                 </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
