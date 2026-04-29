import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import 'react-toastify/dist/ReactToastify.css';

import { selectCurrentUser, selectUserRole } from './store/slices/authSlice';
import Layout from './components/Layout';

import Home from './pages/Home';
import AlbumsPage from './pages/AlbumsPage';
import AlbumDetailPage from './pages/AlbumDetailPage';
import PlaylistsPage from './pages/PlaylistsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import CreatorSignupPage from './pages/CreatorSignupPage';
import CreatorDashboard from './pages/CreatorDashboard';
import SearchPage from './pages/SearchPage';
import ArtistProfilePage from './pages/ArtistProfilePage';

// Protected route HOC
const ProtectedRoute = ({ children, roles }) => {
  const user = useSelector(selectCurrentUser);
  const role = useSelector(selectUserRole);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/apply" element={<CreatorSignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Main app layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/albums/:id" element={<AlbumDetailPage />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/artist/:id" element={<ArtistProfilePage />} />
          <Route path="/creator" element={
            <ProtectedRoute roles={['artist']}><CreatorDashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
        toastStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      />
    </BrowserRouter>
  );
}

export default App;
