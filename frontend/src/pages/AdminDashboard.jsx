import {
  useGetAdminStatsQuery, useGetAdminUsersQuery,
  useChangeUserRoleMutation, useDeleteUserMutation,
  useGetCreatorApplicationsQuery, useApproveCreatorMutation, useRejectCreatorMutation,
} from '../store/services/musicApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { Users, Disc3, Music, ListMusic, Star, TrendingUp, Download, Trash2, Check, X, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { useState } from 'react';

const COLORS = ['#53bcdb','#3a9cba','#68c8e2','#1e8aab','#7dd4ea','#0f6e8e'];

const CustomTooltipStyle = {
  background: 'rgba(5,5,18,0.95)',
  border: '1px solid var(--glass-border)',
  borderRadius: 10,
  color: 'var(--text-primary)',
  fontSize: 13,
  fontFamily: 'var(--font-body)',
};

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="stat-card">
    <Icon size={20} strokeWidth={1.5} color="var(--accent)" style={{ marginBottom: 12 }} />
    <div className="stat-value">{typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}</div>
    <div className="stat-label">{label}</div>
  </div>
);

export default function AdminDashboard() {
  const { data: statsData, isLoading: statsLoading } = useGetAdminStatsQuery();
  const { data: usersData, isLoading: usersLoading } = useGetAdminUsersQuery({});
  const [changeRole] = useChangeUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();

  const [activeTab, setActiveTab] = useState('pending');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: appsData, isLoading: appsLoading } = useGetCreatorApplicationsQuery(activeTab);
  const [approveCreator] = useApproveCreatorMutation();
  const [rejectCreator] = useRejectCreatorMutation();

  const stats = statsData?.data;
  const users = usersData?.data || [];

  const genreData = stats?.topGenres?.map((g) => ({ name: g._id, count: g.count })) || [];
  const monthData = (stats?.albumsPerMonth || []).map((m) => ({
    name: `${m._id.year}/${String(m._id.month).padStart(2,'0')}`,
    albums: m.count,
  })).reverse();

  const handleRoleChange = async (id, role) => {
    try { await changeRole({ id, role }).unwrap(); toast.success('Role updated'); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await deleteUser(id).unwrap(); toast.success('User deleted'); }
    catch { toast.error('Failed'); }
  };

  const handleApprove = async (id) => {
    try {
      await approveCreator(id).unwrap();
      toast.success('Creator application approved!');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return toast.warn('Please provide a reason');
    try {
      await rejectCreator({ id: rejectingId, reason: rejectionReason }).unwrap();
      toast.success('Application rejected');
      setRejectingId(null);
      setRejectionReason('');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to reject');
    }
  };

  if (statsLoading) return <div className="spinner" />;

  return (
    <div className="page-inner" style={{ paddingTop: 28, paddingBottom: 40 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Platform overview & management</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Users" value={stats?.totalUsers} icon={Users} />
        <StatCard label="Albums" value={stats?.totalAlbums} icon={Disc3} />
        <StatCard label="Songs" value={stats?.totalSongs} icon={Music} />
        <StatCard label="Playlists" value={stats?.totalPlaylists} icon={ListMusic} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, marginBottom: 16 }}>
        {/* Pie — genres */}
        <div className="panel">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, marginBottom: 16 }}>Albums by Genre</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={genreData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={76} innerRadius={40}
                label={({ name }) => name.length < 8 ? name : name.slice(0,6) + '…'} labelLine={false}>
                {genreData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={CustomTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Area — albums per month */}
        <div className="panel">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, marginBottom: 16 }}>Albums Added per Month</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthData}>
              <defs>
                <linearGradient id="gradAlbum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#53bcdb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#53bcdb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={CustomTooltipStyle} />
              <Area type="monotone" dataKey="albums" stroke="#53bcdb" strokeWidth={2} fill="url(#gradAlbum)" dot={{ fill: '#53bcdb', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar — top genres */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, marginBottom: 16 }}>Top Genres</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={genreData} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <Tooltip contentStyle={CustomTooltipStyle} />
            <Bar dataKey="count" fill="#53bcdb" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top-rated + Most-played */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="panel">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={16} strokeWidth={1.5} color="var(--warning)" /> Top Rated Albums
          </h3>
          {(stats?.topRatedAlbums || []).map((album, i) => (
            <div key={album._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12, minWidth: 18 }}>{i+1}</span>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{album.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{album.artist}</div>
              </div>
              <span style={{ color: 'var(--warning)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>★ {album.avgRating?.toFixed(1)}</span>
            </div>
          ))}
        </div>
        <div className="panel">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} strokeWidth={1.5} color="var(--accent)" /> Most Played Songs
          </h3>
          {(stats?.mostPlayedSongs || []).map((song, i) => (
            <div key={song._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12, minWidth: 18 }}>{i+1}</span>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{song.artist}</div>
              </div>
              <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{song.playCount?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Creator Applications */}
      <div className="panel" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400 }}>Creator Applications</h3>
          <div style={{ display: 'flex', gap: 8, background: 'var(--glass-1)', padding: 4, borderRadius: 10 }}>
            {['pending', 'approved', 'rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  background: activeTab === tab ? 'var(--accent)' : 'transparent',
                  color: activeTab === tab ? '#000' : 'var(--text-dim)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {tab}
                <span style={{ fontSize: 10, opacity: 0.7 }}>({appsData?.counts?.[tab] || 0})</span>
              </button>
            ))}
          </div>
        </div>

        {appsLoading ? <div className="spinner" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>Artist Info</th>
                <th>Real Name / Email</th>
                <th>Bio Snippet</th>
                <th>Genres</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appsData?.data?.map((app) => (
                <tr key={app._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--glass-2)', overflow: 'hidden' }}>
                        {app.avatar ? <img src={app.avatar} alt="v" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Disc3 size={20} style={{ margin: 10 }} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{app.artistName}</div>
                        {app.socialLinks?.spotify && <div style={{ fontSize: 10, color: 'var(--accent)' }}>Spotify Linked</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{app.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{app.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={app.bio}>
                      {app.bio}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {app.genres?.slice(0, 2).map((g) => <span key={g} className="badge" style={{ fontSize: 9, padding: '2px 6px' }}>{g}</span>)}
                      {app.genres?.length > 2 && <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>+{app.genres.length - 2}</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {activeTab === 'pending' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-primary" style={{ padding: 6, background: 'var(--success)' }} onClick={() => handleApprove(app._id)}>
                          <Check size={14} />
                        </button>
                        <button className="btn-danger" style={{ padding: 6 }} onClick={() => setRejectingId(app._id)}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="badge" style={{ 
                          background: activeTab === 'approved' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255, 77, 77, 0.1)',
                          color: activeTab === 'approved' ? 'var(--success)' : 'var(--danger)',
                          borderColor: 'transparent'
                        }}>
                          {activeTab}
                        </div>
                        {activeTab === 'rejected' && app.rejectionReason && (
                          <div title={app.rejectionReason} style={{ color: 'var(--text-dim)', cursor: 'help' }}>
                            <MessageSquare size={14} />
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {appsData?.data?.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <Clock size={32} opacity={0.3} />
                      No applications found
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Management */}
      <div className="panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400 }}>User Management</h3>
          <a
            href="/api/admin/export/albums"
            className="btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 14px' }}
          >
            <Download size={14} strokeWidth={1.5} /> Export CSV
          </a>
        </div>
        {usersLoading ? <div className="spinner" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--glass-2)', overflow: 'hidden', flexShrink: 0 }}>
                        {u.avatar ? <img src={u.avatar} alt="v" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--glass-3)', fontSize: 14, fontWeight: 600 }}>{u.name?.[0]?.toUpperCase()}</div>}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className="filter-select"
                      style={{ padding: '4px 10px', fontSize: 13 }}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    >
                      <option value="listener">Listener</option>
                      <option value="artist">Artist</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button className="btn-danger" style={{ padding: '5px 10px' }} onClick={() => handleDelete(u._id)}>
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="modal-overlay">
          <motion.div 
            className="modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Reject Application</h3>
              <button className="btn-ghost" style={{ padding: 6, border: 'none' }} onClick={() => setRejectingId(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Rejection Reason</label>
              <textarea 
                className="form-input" 
                rows={4} 
                placeholder="Explain why this application was rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ resize: 'none' }}
              ></textarea>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>This reason will be shown to the applicant.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setRejectingId(null)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--danger)', color: '#fff' }} onClick={handleReject}>Reject Application</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
