import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { 
  useGetCreatorStatsQuery, 
  useGetCreatorContentQuery,
  useUpdateProfileMutation,
  useCreateSongMutation,
  useUpdateSongMutation,
  useDeleteSongMutation,
  useCreateAlbumMutation
} from '../store/services/musicApi';
import { playSong } from '../store/slices/playerSlice';
import { setUser } from '../store/slices/authSlice';
import { 
  Plus, Music, Disc3, TrendingUp, Users, User, Calendar, 
  Upload, X, Loader2, Camera, Save, ArrowRight, Play, Pause, ImageIcon, AlertCircle, FolderPlus
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import CoverImage from '../components/CoverImage';

export default function CreatorDashboard() {
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useGetCreatorStatsQuery();
  const { data: contentData, isLoading: contentLoading, refetch: refetchContent } = useGetCreatorContentQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [createSong, { isLoading: isUploadingSong }] = useCreateSongMutation();
  const [updateSong] = useUpdateSongMutation();
  const [deleteSong] = useDeleteSongMutation();
  const [createAlbum, { isLoading: isCreatingAlbum }] = useCreateAlbumMutation();
  
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [setupData, setSetupData] = useState({ artistName: '', bio: '', avatar: null, avatarPreview: null });
  const [songData, setSongData] = useState({ 
    title: '', album: '', audioFile: null, coverImage: null, coverPreview: ''
  });
  const [albumData, setAlbumData] = useState({
    title: '', genre: '', releaseYear: new Date().getFullYear(), coverImage: null, coverPreview: ''
  });

  const stats = statsData?.data || { totalStreams: 0, totalFollowers: 0, totalAlbums: 0, totalSongs: 0 };
  const content = contentData?.data || { albums: [], songs: [] };
  const dispatch = useDispatch();

  useEffect(() => {
    if (stats.artistName) {
      setSetupData({ artistName: stats.artistName, bio: stats.bio || '', avatar: null, avatarPreview: stats.avatar });
    }
  }, [stats.artistName, stats.bio, stats.avatar]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSetupData({ ...setupData, avatar: file, avatarPreview: URL.createObjectURL(file) });
    }
  };

  const handleProfileSetup = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('artistName', setupData.artistName);
    formData.append('bio', setupData.bio);
    if (setupData.avatar) formData.append('avatar', setupData.avatar);

    try {
      const res = await updateProfile(formData).unwrap();
      dispatch(setUser(res.data));
      toast.success('Profile established! Welcome to the creator hub.');
      refetchStats();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update profile');
    }
  };

  const handlePlaySong = (song) => {
    dispatch(playSong({ song, queue: content.songs }));
  };

  const handleSongUpload = async (e) => {
    e.preventDefault();
    if (!songData.audioFile) return toast.error('Please select an audio file');
    
    const formData = new FormData();
    formData.append('title', songData.title);
    if (songData.album) formData.append('album', songData.album);
    formData.append('audioFile', songData.audioFile);
    if (songData.coverImage) {
      formData.append('coverImage', songData.coverImage);
    }

    try {
      await createSong(formData).unwrap();
      toast.success('Song uploaded successfully! 🎵');
      if (!songData.coverImage) {
        toast.info('Track uploaded! Adding a cover image helps listeners discover your music.', { autoClose: 6000 });
      }
      setShowUpload(false);
      setSongData({ title: '', album: '', audioFile: null, coverImage: null, coverPreview: '' });
      refetchContent();
    } catch (err) {
      toast.error(err.data?.message || 'Upload failed');
    }
  };

  const handleUpdateSong = async (e) => {
    e.preventDefault();
    try {
      await updateSong({ id: editingSong._id, title: editingSong.title }).unwrap();
      toast.success('Song updated');
      setEditingSong(null);
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleDeleteSong = async (id) => {
    if (!window.confirm('Delete this track forever?')) return;
    try {
      await deleteSong(id).unwrap();
      toast.success('Track removed');
      refetchContent();
      refetchStats();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', albumData.title);
    formData.append('genre', albumData.genre);
    formData.append('releaseYear', albumData.releaseYear);
    formData.append('artist', stats.artistName);
    if (albumData.coverImage) formData.append('coverImage', albumData.coverImage);
    try {
      await createAlbum(formData).unwrap();
      toast.success('Album "' + albumData.title + '" created! 💿');
      setShowCreateAlbum(false);
      setAlbumData({ title: '', genre: '', releaseYear: new Date().getFullYear(), coverImage: null, coverPreview: '' });
      refetchContent();
      refetchStats();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to create album');
    }
  };

  if (statsLoading || contentLoading) return <div className="spinner" />;

  // 1. Handle Rejected Status
  if (stats.status === 'rejected') {
    return (
      <div className="auth-page">
        <motion.div className="auth-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255, 77, 77, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <X size={40} />
            </div>
            <h1 style={{ fontSize: 24, marginBottom: 16 }}>Application Rejected</h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 18 }}>
              Sorry sir or mam, you are not allowed to put songs here.
            </p>
            {stats.rejectionReason && (
              <div style={{ marginTop: 24, padding: 16, background: 'var(--glass-1)', borderRadius: 12, fontSize: 14, color: 'var(--text-dim)' }}>
                Reason: {stats.rejectionReason}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. Handle Pending Status
  if (stats.status === 'pending') {
    return (
      <div className="auth-page">
        <motion.div className="auth-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 size={48} className="animate-spin" color="var(--accent)" style={{ marginBottom: 24 }} />
            <h1 style={{ fontSize: 24, marginBottom: 12 }}>Under Review</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Your application is being processed by our team. Check back soon!</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. Handle Profile Onboarding
  if (!stats.artistName) {
    return (
      <div className="auth-page">
        <motion.div className="auth-card" style={{ maxWidth: 500 }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="auth-brand" style={{ marginBottom: 32 }}>
            <h1 className="auth-title">Setup Creator Profile</h1>
            <p className="auth-sub">Complete these details to unlock song uploads</p>
          </div>

          <form onSubmit={handleProfileSetup} className="auth-form">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--glass-2)', overflow: 'hidden', border: '2px solid var(--accent)' }}>
                  {setupData.avatarPreview ? <img src={setupData.avatarPreview} alt="p" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} style={{ margin: 30 }} />}
                </div>
                <label className="icon-btn" style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--accent)', color: '#000', cursor: 'pointer' }}>
                  <Camera size={14} />
                  <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Stage Name</label>
              <input className="form-input" placeholder="Artist Name" value={setupData.artistName} onChange={e => setSetupData({...setupData, artistName: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Biography</label>
              <textarea className="form-input" placeholder="Tell fans about yourself..." rows={3} value={setupData.bio} onChange={e => setSetupData({...setupData, bio: e.target.value})} required />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="animate-spin" /> : <Save size={18} />}
              <span style={{ marginLeft: 8 }}>{isUpdating ? 'Saving...' : 'Establish Identity'}</span>
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // 4. Main Dashboard
  return (
    <div className="page-inner" style={{ paddingTop: 32, paddingBottom: 32 }}>
      <header className="creator-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--glass-border)' }}>
            <img src={stats.avatar || '/default-avatar.png'} alt="v" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 32, marginBottom: 4, fontFamily: 'var(--font-display)' }}>Creator Hub</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Logged in as <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{stats.artistName}</span></p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={() => setShowCreateAlbum(true)}>
            <FolderPlus size={18} /> New Album
          </button>
          <button className="btn-primary" onClick={() => setShowUpload(true)}>
            <Plus size={18} /> Upload Song
          </button>
        </div>
      </header>

      <div className="stats-grid" style={{ marginBottom: 40 }}>
        <StatCard icon={TrendingUp} label="Total Streams" value={stats.totalPlays || 0} />
        <StatCard icon={Users} label="Followers" value={stats.totalFollowers || 0} />
        <StatCard icon={Disc3} label="Albums" value={stats.totalAlbums || 0} />
        <StatCard icon={Music} label="Songs" value={stats.totalSongs || 0} />
      </div>

      <div className="dashboard-content-grid">
        {/* Songs List */}
        <section className="panel" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 500 }}>Your Tracks</h2>
            <Music size={18} color="var(--text-dim)" />
          </div>
          <div style={{ maxHeight: 500, overflowY: 'auto', overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 500 }}>
              <thead>
                <tr>
                  <th>Song</th>
                  <th>Album</th>
                  <th>Plays</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {content.songs?.map(item => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                          <CoverImage src={item.coverImage} size={40} rounded="sm" />
                          {!item.coverImage && (
                            <div title="Missing Artwork" style={{ position: 'absolute', top: -5, right: -5, background: 'var(--warning)', color: '#000', borderRadius: '50%', padding: 1 }}>
                              <AlertCircle size={10} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{item.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{item.duration ? `${Math.floor(item.duration/60)}:${String(item.duration%60).padStart(2,'0')}` : '--:--'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{item.album?.title || 'Single'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{item.playCount?.toLocaleString() || 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="play-btn-small" style={{ width: 28, height: 28 }} onClick={() => handlePlaySong(item)}>
                          <Play size={12} fill="currentColor" />
                        </button>
                        <button className="icon-btn" style={{ padding: 6 }} onClick={() => setEditingSong(item)}>
                          <Camera size={14} />
                        </button>
                        <button className="icon-btn" style={{ padding: 6, color: 'var(--error)' }} onClick={() => handleDeleteSong(item._id)}>
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!content.songs || content.songs.length === 0) && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>No songs uploaded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Albums List */}
        <section className="panel" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 500 }}>Albums</h2>
          </div>
          <div style={{ padding: 24 }} className="albums-grid">
            {content.albums?.map(album => (
              <div key={album._id} className="creator-album-card" style={{ position: 'relative' }}>
                <CoverImage src={album.coverImage} alt={album.title} size="100%" rounded="md" />
                {!album.coverImage && (
                  <div className="missing-badge">Add Cover</div>
                )}
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{album.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{album.songs?.length || 0} songs</div>
                </div>
              </div>
            ))}
            {(!content.albums || content.albums.length === 0) && (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: 40, color: 'var(--text-dim)', border: '1px dashed var(--glass-border)', borderRadius: 12 }}>
                Create an album to start organizing your music.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Song Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div className="modal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Upload New Track</h3>
              <button className="icon-btn" onClick={() => setShowUpload(false)}><X /></button>
            </div>
            <form onSubmit={handleSongUpload} className="auth-form" style={{ marginTop: 20 }}>
              <div className="form-group">
                <label className="form-label">Song Title</label>
                <input className="form-input" placeholder="Enter track title" value={songData.title} onChange={e => setSongData({...songData, title: e.target.value})} required />
              </div>
              
              <div className="form-group">
                <label className="form-label">Select Album (Optional)</label>
                <select className="form-input" value={songData.album} onChange={e => setSongData({...songData, album: e.target.value})}>
                  <option value="">Single (No Album)</option>
                  {content.albums?.map(a => <option key={a._id} value={a._id}>{a.title}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Cover Art (Optional)</label>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 12, background: 'var(--glass-2)', overflow: 'hidden', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                    {songData.coverPreview ? <img src={songData.coverPreview} alt="v" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={24} style={{ margin: 28, color: 'var(--text-dim)' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input type="file" id="cover-upload" hidden accept="image/*" onChange={e => {
                      const file = e.target.files[0];
                      if (file) setSongData({...songData, coverImage: file, coverPreview: URL.createObjectURL(file)});
                    }} />
                    <label htmlFor="cover-upload" className="btn-ghost" style={{ padding: '8px 16px', fontSize: 12, cursor: 'pointer' }}>
                      <Camera size={14} /> Choose Image
                    </label>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>Adding a cover image helps listeners discover your music</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Audio File (Any format)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="file" 
                    id="audio-upload" 
                    hidden 
                    accept="audio/*" 
                    onChange={e => setSongData({...songData, audioFile: e.target.files[0]})} 
                  />
                  <label htmlFor="audio-upload" className="panel" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 16px', border: '1px dashed var(--glass-border)' }}>
                    <Upload size={18} color="var(--accent)" />
                    <span style={{ fontSize: 13, color: songData.audioFile ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                      {songData.audioFile ? songData.audioFile.name : 'Select audio file...'}
                    </span>
                  </label>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>Supported: mp3, wav, flac, ogg, m4a, etc. Max 100MB.</p>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowUpload(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isUploadingSong}>
                  {isUploadingSong ? <Loader2 className="animate-spin" /> : 'Start Upload'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Edit Song Modal */}
      {editingSong && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div className="modal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Track Info</h3>
              <button className="icon-btn" onClick={() => setEditingSong(null)}><X /></button>
            </div>
            <form onSubmit={handleUpdateSong} className="auth-form" style={{ marginTop: 20 }}>
              <div className="form-group">
                <label className="form-label">Song Title</label>
                <input 
                  className="form-input" 
                  value={editingSong.title} 
                  onChange={e => setEditingSong({...editingSong, title: e.target.value})} 
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setEditingSong(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {showCreateAlbum && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div className="modal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Album</h3>
              <button className="icon-btn" onClick={() => setShowCreateAlbum(false)}><X /></button>
            </div>
            <form onSubmit={handleCreateAlbum} className="auth-form" style={{ marginTop: 20 }}>
              <div className="form-group">
                <label className="form-label">Album Cover</label>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 12, background: 'var(--glass-2)', overflow: 'hidden', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                    {albumData.coverPreview
                      ? <img src={albumData.coverPreview} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <ImageIcon size={24} style={{ margin: 28, color: 'var(--text-dim)' }} />}
                  </div>
                  <div>
                    <input type="file" id="album-cover-upload" hidden accept="image/*" onChange={e => {
                      const file = e.target.files[0];
                      if (file) setAlbumData({...albumData, coverImage: file, coverPreview: URL.createObjectURL(file)});
                    }} />
                    <label htmlFor="album-cover-upload" className="btn-ghost" style={{ padding: '8px 16px', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Camera size={14} /> Choose Cover
                    </label>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>Recommended: 500x500px</p>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Album Title</label>
                <input className="form-input" placeholder="Enter album name" value={albumData.title} onChange={e => setAlbumData({...albumData, title: e.target.value})} required />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Genre</label>
                  <input className="form-input" placeholder="e.g. Pop, Hip-Hop" value={albumData.genre} onChange={e => setAlbumData({...albumData, genre: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Release Year</label>
                  <input className="form-input" type="number" min="1900" max="2099" value={albumData.releaseYear} onChange={e => setAlbumData({...albumData, releaseYear: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreateAlbum(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isCreatingAlbum}>
                  {isCreatingAlbum ? <Loader2 className="animate-spin" size={18} /> : <FolderPlus size={16} />}
                  <span style={{ marginLeft: 4 }}>{isCreatingAlbum ? 'Creating...' : 'Create Album'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ padding: 12, background: 'var(--glass-1)', borderRadius: 12, color: 'var(--accent)', border: '1px solid var(--glass-border)' }}>
        <Icon size={24} />
      </div>
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      </div>
    </div>
  );
}
