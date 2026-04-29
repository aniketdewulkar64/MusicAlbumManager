import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useGetProfileQuery, useUpdateProfileMutation } from '../store/services/musicApi';
import { setUser } from '../store/slices/authSlice';
import { 
  User, Camera, Save, Loader2, Mail, Shield, Check, 
  Lock, Globe, Instagram, Music, AlertCircle, Image as ImageIcon 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const { data: profileData, isLoading, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const dispatch = useDispatch();
  
  const [activeTab, setActiveTab] = useState('account');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: null,
    avatarPreview: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    artistName: '',
    bio: '',
    genres: [],
    socialLinks: { spotify: '', instagram: '', website: '' }
  });

  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (profileData?.data) {
      const user = profileData.data;
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        avatarPreview: user.avatar || '',
        artistName: user.artistName || '',
        bio: user.bio || '',
        genres: user.genres || [],
        socialLinks: {
          spotify: user.socialLinks?.spotify || '',
          instagram: user.socialLinks?.instagram || '',
          website: user.socialLinks?.website || ''
        }
      }));
      setIsDirty(false);
    }
  }, [profileData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return toast.error('Please select a JPG, PNG, or WEBP image.');
      }
      if (file.size > 2 * 1024 * 1024) {
        return toast.error('Image size must be less than 2MB.');
      }
      setFormData({
        ...formData,
        avatar: file,
        avatarPreview: URL.createObjectURL(file)
      });
      setIsDirty(true);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (formData.newPassword) {
      if (!formData.currentPassword) newErrors.currentPassword = 'Current password is required to set a new one';
      if (formData.newPassword.length < 6) newErrors.newPassword = 'New password must be at least 6 characters';
      if (formData.newPassword !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = new FormData();
    data.append('name', formData.name);
    if (formData.avatar) data.append('avatar', formData.avatar);
    
    if (formData.currentPassword && formData.newPassword) {
      data.append('currentPassword', formData.currentPassword);
      data.append('newPassword', formData.newPassword);
    }

    if (profileData?.data?.role === 'artist') {
      data.append('artistName', formData.artistName);
      data.append('bio', formData.bio);
      data.append('genres', JSON.stringify(formData.genres));
      data.append('socialLinks', JSON.stringify(formData.socialLinks));
    }

    try {
      const res = await updateProfile(data).unwrap();
      toast.success('Profile updated successfully! 🚀');
      dispatch(setUser(res.data));
      setIsDirty(false);
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update profile');
    }
  };

  if (isLoading) return <div className="spinner" />;

  const user = profileData?.data;
  const isArtist = user?.role === 'artist';

  return (
    <div className="page-inner" style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Profile Header */}
      <header className="profile-header-card">
        <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
          <div style={{ 
            width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', 
            background: 'var(--glass-2)', border: '2px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px var(--accent-soft)'
          }}>
            {formData.avatarPreview ? (
              <img src={formData.avatarPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={48} style={{ color: 'var(--accent)', opacity: 0.8 }} />
            )}
          </div>
          <label className="icon-btn-float" style={{ 
            position: 'absolute', bottom: '0', right: '0', 
            background: 'var(--accent)', color: '#000', cursor: 'pointer',
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)', border: '2px solid var(--bg-main)'
          }}>
            <Camera size={16} />
            <input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={handleFileChange} />
          </label>
        </div>

        <div>
          <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>{user?.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none', padding: '4px 12px' }}>{user?.role}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </header>

      <div className="profile-content-grid">
        {/* Navigation Sidebar */}
        <aside className="profile-sidebar">
          <nav className="panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              type="button"
              className={`nav-item ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                border: 'none', background: activeTab === 'account' ? 'var(--accent-soft)' : 'transparent',
                color: activeTab === 'account' ? 'var(--accent)' : 'var(--text-secondary)',
                borderRadius: '12px', cursor: 'pointer', transition: 'var(--transition)',
                fontSize: '14px', fontWeight: activeTab === 'account' ? '600' : '400'
              }}
            >
              <User size={18} /> General Settings
            </button>
            {isArtist && (
              <button 
                type="button"
                className={`nav-item ${activeTab === 'public' ? 'active' : ''}`}
                onClick={() => setActiveTab('public')}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  border: 'none', background: activeTab === 'public' ? 'var(--accent-soft)' : 'transparent',
                  color: activeTab === 'public' ? 'var(--accent)' : 'var(--text-secondary)',
                  borderRadius: '12px', cursor: 'pointer', transition: 'var(--transition)',
                  fontSize: '14px', fontWeight: activeTab === 'public' ? '600' : '400'
                }}
              >
                <Music size={18} /> Artist Dashboard
              </button>
            )}
          </nav>

          <div className="panel" style={{ marginTop: '24px', padding: '24px' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Stats</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Albums</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{user?.totalAlbums || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Favorites</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{user?.favorites?.length || 0}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Form Sections */}
        <main>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <AnimatePresence mode="wait">
              {activeTab === 'account' ? (
                <motion.div 
                  key="account"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
                >
                  {/* Personal Info Card */}
                  <section className="panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                      <Shield size={20} color="var(--accent)" />
                      <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Personal Information</h2>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input 
                        className={`form-input ${errors.name ? 'error' : ''}`}
                        value={formData.name} 
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Your display name"
                      />
                      {errors.name && <p className="error-text">{errors.name}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <div style={{ position: 'relative' }}>
                        <input className="form-input disabled" value={formData.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                        <Check size={16} style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--success)' }} />
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>Your email is verified and cannot be changed.</p>
                    </div>
                  </section>

                  {/* Security Card */}
                  <section className="panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                      <Lock size={20} color="var(--accent)" />
                      <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Security & Privacy</h2>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <input 
                        type="password"
                        className={`form-input ${errors.currentPassword ? 'error' : ''}`}
                        value={formData.currentPassword} 
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        placeholder="Required to update password"
                      />
                      {errors.currentPassword && <p className="error-text">{errors.currentPassword}</p>}
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input 
                          type="password"
                          className={`form-input ${errors.newPassword ? 'error' : ''}`}
                          value={formData.newPassword} 
                          onChange={(e) => handleInputChange('newPassword', e.target.value)}
                          placeholder="Min. 6 chars"
                        />
                        {errors.newPassword && <p className="error-text">{errors.newPassword}</p>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input 
                          type="password"
                          className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                          value={formData.confirmPassword} 
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        />
                        {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
                      </div>
                    </div>
                  </section>
                </motion.div>
              ) : (
                <motion.div 
                  key="public"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
                >
                  <section className="panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                      <Music size={20} color="var(--accent)" />
                      <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Artist Information</h2>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Stage Name</label>
                      <input 
                        className="form-input" 
                        value={formData.artistName} 
                        onChange={(e) => handleInputChange('artistName', e.target.value)}
                        placeholder="Public name for your music"
                      />
                    </div>

                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>Artist Bio</label>
                        <span style={{ fontSize: '11px', color: formData.bio.length > 280 ? 'var(--error)' : 'var(--text-dim)' }}>
                          {formData.bio.length}/300
                        </span>
                      </div>
                      <textarea 
                        className="form-input" 
                        rows={6}
                        value={formData.bio} 
                        onChange={(e) => handleInputChange('bio', e.target.value.slice(0, 300))}
                        placeholder="Tell your story to your fans..."
                      />
                    </div>
                  </section>

                  <section className="panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                      <Globe size={20} color="var(--accent)" />
                      <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Social & Web Presence</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="social-input-row">
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Spotify URL</span>
                        <input 
                          className="form-input"
                          value={formData.socialLinks.spotify}
                          onChange={(e) => handleInputChange('socialLinks', { ...formData.socialLinks, spotify: e.target.value })}
                        />
                      </div>
                      <div className="social-input-row">
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Instagram</span>
                        <input 
                          className="form-input"
                          value={formData.socialLinks.instagram}
                          onChange={(e) => handleInputChange('socialLinks', { ...formData.socialLinks, instagram: e.target.value })}
                        />
                      </div>
                      <div className="social-input-row">
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Website</span>
                        <input 
                          className="form-input"
                          value={formData.socialLinks.website}
                          onChange={(e) => handleInputChange('socialLinks', { ...formData.socialLinks, website: e.target.value })}
                        />
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '32px' }}>
              {isDirty && (
                <button type="button" className="btn-ghost" onClick={() => refetch()}>
                  Cancel Changes
                </button>
              )}
              <button 
                type="submit" 
                className="btn-primary"
                disabled={isUpdating || !isDirty}
                style={{ padding: '12px 40px', fontSize: '14px' }}
              >
                {isUpdating ? (
                  <><Loader2 size={18} className="spinner" /> Saving...</>
                ) : (
                  <><Save size={18} /> Update Profile</>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
