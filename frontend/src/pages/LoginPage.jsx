import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Disc3, LogIn } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import { musicApi } from '../store/services/musicApi';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import logo from '../assets/melodia.png';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6).required('Password is required'),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, setError, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      dispatch(musicApi.util.resetApiState());
      dispatch(setCredentials(res.data));
      
      const { user } = res.data;
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'artist') navigate('/creator/dashboard');
      else navigate('/');

      toast.success(`Welcome back, ${user.name}`);
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError('root', { type: 'manual', message });
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
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to Melodia</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          {errors.root && <div className="form-error" style={{ marginBottom: 16, textAlign: 'center', background: 'rgba(255, 77, 77, 0.1)', padding: 8, borderRadius: 8 }}>{errors.root.message}</div>}
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className={`form-input ${errors.email ? 'error-input' : ''}`} type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--accent)' }}>Forgot?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                className={`form-input ${errors.password ? 'error-input' : ''}`} 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                {...register('password')} 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>



          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4, height: 44 }} disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} strokeWidth={1.5} />}
            <span style={{ marginLeft: 8 }}>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <p className="auth-footer">
          No account?{' '}
          <Link to="/register" className="auth-link">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
