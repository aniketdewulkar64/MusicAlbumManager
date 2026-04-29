import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Grid3X3, List, SlidersHorizontal, Plus, Trash2 } from 'lucide-react';
import { useGetAlbumsQuery, useDeleteAlbumMutation } from '../store/services/musicApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectUserRole } from '../store/slices/authSlice';
import { useDispatch } from 'react-redux';
import { playSong } from '../store/slices/playerSlice';
import { toast } from 'react-toastify';

const GENRES = ['Pop', 'Rock', 'Jazz', 'Hip-Hop', 'Classical', 'Electronic', 'R&B', 'Country', 'Folk', 'Metal', 'Other'];
const SORTS = [
  { value: 'createdAt', label: 'Latest' },
  { value: 'releaseYear', label: 'Year' },
  { value: 'avgRating', label: 'Top Rated' },
  { value: 'title', label: 'Title A–Z' },
];

const container = { animate: { transition: { staggerChildren: 0.05 } } };
const item = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4,0,0.2,1] } } };

export default function AlbumsPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('grid');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const role = useSelector(selectUserRole);
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    const s = searchParams.get('search');
    if (s) setSearch(s);
  }, [searchParams]);

  const { data, isLoading } = useGetAlbumsQuery({ search, genre, sort, order, page, limit: 16 });
  const [deleteAlbum] = useDeleteAlbumMutation();

  const albums = data?.data || [];
  const totalPages = data?.pages || 1;

  const ph = (a) => `https://placehold.co/200x200/0a0a18/53bcdb?text=${encodeURIComponent(a.title?.[0] || 'M')}`;

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this album?')) return;
    try { await deleteAlbum(id).unwrap(); toast.success('Album deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '28px 32px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, color: 'var(--text-primary)' }}>Explore Music</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>{data?.total || 0} albums</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className={`icon-btn${view === 'grid' ? ' active' : ''}`} onClick={() => setView('grid')}><Grid3X3 size={16} strokeWidth={1.5} /></button>
          <button className={`icon-btn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')}><List size={16} strokeWidth={1.5} /></button>
          {(role === 'admin' || role === 'artist') && (
            <Link to="/albums/new" className="btn-primary" style={{ gap: 6 }}><Plus size={15} strokeWidth={2} /> Add Album</Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginTop: 20 }}>
        <div className="filter-search">
          <SlidersHorizontal size={14} strokeWidth={1.5} color="var(--text-muted)" />
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="filter-select" value={genre} onChange={(e) => { setGenre(e.target.value); setPage(1); }}>
          <option value="">All Genres</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="filter-select" value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="desc">↓ Descending</option>
          <option value="asc">↑ Ascending</option>
        </select>
      </div>

      {/* Grid view */}
      {view === 'grid' ? (
        <motion.div className="albums-grid" variants={container} initial="initial" animate="animate">
          {isLoading
            ? [...Array(16)].map((_, i) => (
                <div key={i}><div className="skeleton skeleton-art" /><div className="skeleton skeleton-text-md" /><div className="skeleton skeleton-text-sm" /></div>
              ))
            : albums.length === 0
            ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🎵</p>
                <p>No albums found</p>
              </div>
            : albums.map((album) => (
                <motion.div key={album._id} variants={item} className="album-card" onClick={() => navigate(`/albums/${album._id}`)}>
                  <div className="album-card-art">
                    <img src={album.coverImage || ph(album)} alt={album.title} loading="lazy" />
                    <div className="album-card-overlay">
                      <button className="play-btn-circle" onClick={(e) => { e.stopPropagation(); dispatch(playSong(album)); }}>
                        <Play size={18} strokeWidth={2} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                  <div className="album-card-title">{album.title}</div>
                  <div className="album-card-artist">{album.artist}</div>
                  <div className="album-card-meta">
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{album.releaseYear}</span>
                    {album.genre?.slice(0,1).map((g) => (
                      <span key={g} className="badge" style={{ fontSize: 10, padding: '2px 7px' }}>{g}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
        </motion.div>
      ) : (
        /* List view */
        <div className="home-tracks-wrapper">
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}></th>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Genre</th>
                  <th>Year</th>
                  <th>Rating</th>
                  {role === 'admin' && <th></th>}
                </tr>
              </thead>
              <tbody>
                {isLoading ? [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((__, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                )) : albums.map((album) => (
                  <tr key={album._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/albums/${album._id}`)}>
                    <td>
                      <img src={album.coverImage || ph(album)} alt={album.title}
                        style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--glass-border)' }} />
                    </td>
                    <td style={{ fontWeight: 500 }}>{album.title}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{album.artist}</td>
                    <td>{album.genre?.slice(0,1).map((g) => <span key={g} className="badge">{g}</span>)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 13 }}>{album.releaseYear}</td>
                    <td style={{ color: 'var(--warning)', fontSize: 13 }}>
                      {album.avgRating > 0 ? `★ ${album.avgRating.toFixed(1)}` : '—'}
                    </td>
                    {role === 'admin' && (
                      <td>
                        <button className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={(e) => handleDelete(album._id, e)}>
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '28px 32px' }}>
          <button className="btn-ghost" style={{ padding: '8px 18px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-mono)', padding: '0 8px' }}>
            {page} / {totalPages}
          </span>
          <button className="btn-ghost" style={{ padding: '8px 18px' }} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
