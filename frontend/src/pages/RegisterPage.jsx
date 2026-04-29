import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Disc3, UserPlus, Headphones, Mic, Loader2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import { musicApi } from '../store/services/musicApi';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { toast } from 'react-toastify';
import logo from '../assets/melodia.png';

const schema = yup.object({
  name: yup.string().min(2).required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Min 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match'),
  role: yup.string().oneOf(['listener', 'artist']).default('listener'),
});

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({ 
    resolver: yupResolver(schema), 
    defaultValues: { role: 'listener' } 
  });

  const selectedRole = watch('role');

  const onSubmit = async ({ confirmPassword, ...data }) => {
    setLoading(true);
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    if (avatarFile) formData.append('avatar', avatarFile);

    try {
      const res = await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.user) {
        dispatch(musicApi.util.resetApiState());
        dispatch(setCredentials(res.data));
        toast.success(`Welcome to Melodia, ${res.data.user.name}! 🎵`);
        navigate('/');
      } else {
        toast.success(res.data.message || 'Application submitted! Please wait for admin approval.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div className="auth-brand">
          <img src={logo} alt="logo" style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 12 }} />
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-sub">Join Melodia today</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">I want to join as</label>
            <div className="role-cards">
              <div 
                className={`role-card ${selectedRole === 'listener' ? 'selected' : ''}`}
                onClick={() => setValue('role', 'listener')}
              >
                <Headphones size={32} />
                <span style={{ fontWeight: 600 }}>Listener</span>
              </div>
              <div 
                className={`role-card ${selectedRole === 'artist' ? 'selected' : ''}`}
                onClick={() => setValue('role', 'artist')}
              >
                <Mic size={32} />
                <span style={{ fontWeight: 600 }}>Creator</span>
                <span className="role-card-badge">Requires Approval</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className={`form-input ${errors.name ? 'error-input' : ''}`} placeholder="Your name" {...register('name')} />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className={`form-input ${errors.email ? 'error-input' : ''}`} type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className={`form-input ${errors.password ? 'error-input' : ''}`} type="password" placeholder="Min 6 characters" {...register('password')} />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className={`form-input ${errors.confirmPassword ? 'error-input' : ''}`} type="password" placeholder="Repeat password" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Profile Picture (Optional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--glass-2)', overflow: 'hidden' }}>
                {avatarPreview ? <img src={avatarPreview} alt="v" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserPlus size={20} style={{ margin: 10, opacity: 0.5 }} />}
              </div>
              <input type="file" accept="image/*" onChange={e => {
                if (e.target.files[0]) {
                  setAvatarFile(e.target.files[0]);
                  setAvatarPreview(URL.createObjectURL(e.target.files[0]));
                }
              }} style={{ fontSize: 13 }} />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4, height: 44 }} disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} strokeWidth={1.5} />}
            <span style={{ marginLeft: 8 }}>{loading ? 'Creating account...' : 'Create Account'}</span>
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: 16 }}>
          Looking to share your music?{' '}
          <Link to="/apply" className="auth-link">Apply as Creator</Link>
        </p>
        <p className="auth-footer" style={{ marginTop: 8 }}>
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
