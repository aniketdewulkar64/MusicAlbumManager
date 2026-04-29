import { useParams, Link } from 'react-router-dom';
import { 
  useGetProfileQuery, 
  useFollowArtistMutation,
  useGetAlbumsQuery
} from '../store/services/musicApi';
import { 
  User, Check, Music, Link as LinkIcon, Play
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ArtistProfilePage() {
  const { id } = useParams();
  const currentUser = useSelector(selectCurrentUser);
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const res = await api.get(`/users/profile/${id}`);
        setArtist(res.data.data);
      } catch (err) {
        toast.error('Artist not found');
      } finally { setLoading(false); }
    };
    fetchArtist();
  }, [id]);

  const { data: albumsData } = useGetAlbumsQuery({ artist: artist?.artistName }, { skip: !artist });
  const [follow] = useFollowArtistMutation();

  const isFollowing = artist?.followers?.some(fid => (fid._id || fid) === currentUser?._id);

  const handleFollow = async () => {
    if (!currentUser) return toast.error('Please sign in to follow artists');
    try {
      await follow(id).unwrap();
      setArtist(prev => ({
        ...prev,
        followers: isFollowing 
          ? prev.followers.filter(fid => (fid._id || fid) !== currentUser._id)
          : [...(prev.followers || []), currentUser._id]
      }));
      toast.success(isFollowing ? `Unfollowed ${artist.artistName}` : `Following ${artist.artistName}`);
    } catch { toast.error('Action failed'); }
  };

  if (loading) return <div className="spinner" />;
  if (!artist) return <div style={{ padding: 40, textAlign: 'center' }}>Artist not found</div>;

  const albums = albumsData?.data || [];

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Hero */}
      <div className="artist-profile-hero" style={{ 
        height: 300, background: 'linear-gradient(to bottom, var(--glass-3), var(--bg-main))',
        display: 'flex', alignItems: 'flex-end', padding: '0 40px 40px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32 }}>
          <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'var(--glass-2)', overflow: 'hidden' }}>
             {artist.avatar ? <img src={artist.avatar} alt="v" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={48} style={{ margin: 56, opacity: 0.2 }} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', marginBottom: 8 }}>
               <Check size={14} style={{ background: 'var(--accent)', color: '#000', borderRadius: '50%', padding: 2 }} />
               <span style={{ fontSize: 12, fontWeight: 700 }}>VERIFIED ARTIST</span>
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 800, margin: 0 }}>{artist.artistName}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>{artist.followers?.length || 0} Followers • {artist.genres?.join(', ')}</p>
          </div>
        </div>
      </div>

      <div className="page-inner" style={{ paddingTop: 32, paddingBottom: 0 }}>
        <button 
          className={`btn-primary ${isFollowing ? 'btn-ghost' : ''}`}
          onClick={handleFollow}
          style={{ marginBottom: 40 }}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>About</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 600 }}>{artist.bio}</p>
        </section>

        <section>
          <h2 style={{ fontSize: 20, marginBottom: 20 }}>Discography</h2>
          <div className="albums-grid">
            {albums.map(album => (
              <Link key={album._id} to={`/albums/${album._id}`} className="album-card">
                 <div className="album-art-wrap">
                   <img src={album.coverImage || '/placeholder-album.png'} className="album-art" alt="cv" />
                 </div>
                 <div className="album-info">
                   <div className="album-title">{album.title}</div>
                   <div className="album-artist">{album.releaseYear} • {album.genre}</div>
                 </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
