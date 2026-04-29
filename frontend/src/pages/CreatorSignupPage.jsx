import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Camera, Clock, Loader2, Music, Link as LinkIcon } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function CreatorSignupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', artistName: '', bio: '', avatar: null });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const navigate = useNavigate();

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('artistName', formData.artistName);
    data.append('bio', formData.bio);
    data.append('role', 'artist');
    if (formData.avatar) data.append('avatar', formData.avatar);

    try {
      await api.post('/auth/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    } finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <Clock size={40} color="var(--accent)" />
          <h2 style={{ margin: '20px 0' }}>Application Submitted</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Our team will review your profile shortly.</p>
          <button className="btn-primary" style={{ marginTop: 32, width: '100%' }} onClick={() => navigate('/')}>Back Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 450 }}>
        <h2 style={{ marginBottom: 24 }}>Artist Application</h2>
        <form onSubmit={onSubmit}>
          {step === 1 && (
            <div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Profile Picture</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--glass-2)', overflow: 'hidden' }}>
                    {avatarPreview ? <img src={avatarPreview} alt="v" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={20} style={{ margin: 14, opacity: 0.5 }} />}
                  </div>
                  <input type="file" accept="image/*" onChange={e => {
                    if (e.target.files[0]) {
                      setFormData({...formData, avatar: e.target.files[0]});
                      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </div>
              </div>
              <button type="button" className="btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={handleNext}>Next Step</button>
            </div>
          )}
          {step === 2 && (
            <div>
              <div className="form-group">
                <label className="form-label">Artist Name</label>
                <input className="form-input" value={formData.artistName} onChange={e => setFormData({...formData, artistName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-input" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} required rows={3} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={handlePrev}>Back</button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : 'Submit'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
