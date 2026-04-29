import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Library } from 'lucide-react';
import { useGetPlaylistsQuery, useCreatePlaylistMutation } from '../store/services/musicApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { toast } from 'react-toastify';

const fmt = (s) => { if (!s) return '—'; const m = Math.floor(s/60); return `${m}:${(s%60).toString().padStart(2,'0')}`; };

const container = { animate: { transition: { staggerChildren: 0.06 } } };
const item = { initial: { opacity:0, y:14 }, animate: { opacity:1, y:0, transition: { duration:0.3, ease:[0.4,0,0.2,1] } } };

export default function PlaylistsPage() {
  const user = useSelector(selectCurrentUser);
  const { data, isLoading } = useGetPlaylistsQuery();
  const [createPlaylist] = useCreatePlaylistMutation();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  const playlists = data?.data || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createPlaylist({ name, description: desc, isPublic }).unwrap();
      toast.success('Playlist created!');
      setShowModal(false); setName(''); setDesc('');
    } catch { toast.error('Failed to create playlist'); }
    finally { setCreating(false); }
  };

  return (
    <div>
      <div className="home-tracks-wrapper" style={{ paddingTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, color: 'var(--text-primary)' }}>Playlists</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{playlists.length} playlists</p>
        </div>
        {user && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} strokeWidth={2} /> New Playlist
          </button>
        )}
      </div>

      <div className="home-tracks-wrapper" style={{ paddingTop: 24, paddingBottom: 24 }}>
        {isLoading ? (
          <div className="albums-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i}><div className="skeleton skeleton-art" /><div className="skeleton skeleton-text-md" /><div className="skeleton skeleton-text-sm" /></div>
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <Library size={48} strokeWidth={1} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <p>No playlists yet.</p>
            {user && <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>Create your first playlist to get started.</p>}
          </div>
        ) : (
          <motion.div className="albums-grid" variants={container} initial="initial" animate="animate">
            {playlists.map((pl) => {
              const owned = user && pl.owner?._id === user._id;
              return (
                <motion.div key={pl._id} variants={item} className="album-card">
                  <div className="album-card-art" style={{ background: `linear-gradient(135deg, var(--bg-tertiary), rgba(83,188,219,0.12))`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Library size={48} strokeWidth={1} color="var(--accent)" style={{ opacity: 0.6 }} />
                    {owned && (
                      <div className="album-card-overlay">
                        <span className="badge">Your playlist</span>
                      </div>
                    )}
                  </div>
                  <div className="album-card-title">{pl.name}</div>
                  <div className="album-card-artist">{pl.owner?.name}</div>
                  <div className="album-card-meta">
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{pl.songs?.length || 0} songs</span>
                    <span>·</span>
                    <span>{pl.isPublic ? '🌐' : '🔒'}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.34,1.56,0.64,1] }}
            >
              <div className="modal-header">
                <h2 className="modal-title">New Playlist</h2>
                <button className="icon-btn" onClick={() => setShowModal(false)}><X size={16} strokeWidth={1.5} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" placeholder="My Playlist" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" placeholder="Optional..." value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                  <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                  Make public
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={creating}>
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
