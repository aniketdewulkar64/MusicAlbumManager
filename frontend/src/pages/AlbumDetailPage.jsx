import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Heart, Star, Clock, User, Pause, ChevronRight } from 'lucide-react';
import {
  useGetAlbumQuery,
  useGetAlbumReviewsQuery,
  useCreateReviewMutation,
  useToggleFavoriteMutation,
} from '../store/services/musicApi';
import { useDispatch, useSelector } from 'react-redux';
import { playSong, togglePlay, selectPlayer, setExpanded } from '../store/slices/playerSlice';
import { selectCurrentUser } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import CoverImage from '../components/CoverImage';
import Equalizer from '../components/Equalizer';

const fmt = (s) => {
  if (!s) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          className="star-btn"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
        >
          <Star
            size={22}
            strokeWidth={1.5}
            color={s <= (hover || value) ? 'var(--warning)' : 'var(--text-muted)'}
            fill={s <= (hover || value) ? 'var(--warning)' : 'none'}
          />
        </button>
      ))}
    </div>
  );
}

export default function AlbumDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { currentSong, isPlaying } = useSelector(selectPlayer);

  const { data: albumData, isLoading } = useGetAlbumQuery(id);
  const { data: reviewsData } = useGetAlbumReviewsQuery({ id });
  const [createReview, { isLoading: submitting }] = useCreateReviewMutation();
  const [toggleFav] = useToggleFavoriteMutation();

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const album = albumData?.data;
  const reviews = reviewsData?.data || [];
  const cover = album?.coverImage;

  if (isLoading) return <div className="spinner" />;
  if (!album) return (
    <div style={{ textAlign: 'center', padding: '80px 32px', color: 'var(--text-secondary)' }}>
      Album not found
    </div>
  );

  const handlePlayAll = () => {
    if (!album.songs?.length) return toast.info('No songs in this album yet');
    const firstSong = album.songs[0];
    if (currentSong?._id === firstSong._id) {
      dispatch(togglePlay());
    } else {
      dispatch(playSong({ song: firstSong, queue: album.songs, index: 0 }));
    }
  };

  const handleSongClick = (song, index) => {
    if (currentSong?._id === song._id) {
      dispatch(setExpanded(true));
    } else {
      dispatch(playSong({ song, queue: album.songs, index }));
    }
  };

  const handleFav = async () => {
    if (!user) { toast.error('Sign in to favorite albums'); return; }
    try {
      await toggleFav(id);
      toast.success('Added to favorites!');
    } catch {
      toast.error('Failed to update favorites');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Sign in to leave a review'); return; }
    if (!reviewText.trim()) { toast.error('Please write something'); return; }
    try {
      await createReview({ albumId: id, rating, review: reviewText }).unwrap();
      toast.success('Review submitted! ⭐');
      setReviewText('');
      setRating(5);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to submit review');
    }
  };

  const isAlbumPlaying = isPlaying && album.songs?.some(s => s._id === currentSong?._id);

  const totalDuration = album.songs?.reduce((acc, s) => acc + (s.duration || 0), 0) || 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

      {/* ── Album Hero ── */}
      <div className="album-detail-hero">
        {cover && <div className="album-detail-bg" style={{ backgroundImage: `url(${cover})` }} />}
        <div className="album-detail-gradient" />
        <CoverImage
          src={cover}
          alt={album.title}
          size={200}
          rounded="lg"
          className="album-detail-cover"
        />
        <div className="album-detail-info">
          <p className="album-detail-label">Album</p>
          <h1 className="album-detail-title">{album.title}</h1>
          <p className="album-detail-artist">{album.artist}</p>
          <div className="album-detail-meta">
            {album.genre?.slice(0, 2).map((g) => (
              <span key={g} className="badge" style={{ marginRight: 4 }}>{g}</span>
            ))}
            {album.releaseYear && (
              <>
                <span className="meta-dot">·</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{album.releaseYear}</span>
              </>
            )}
            <span className="meta-dot">·</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{album.songs?.length || 0} songs</span>
            {totalDuration > 0 && (
              <>
                <span className="meta-dot">·</span>
                <Clock size={12} strokeWidth={1.5} />
                <span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(totalDuration)}</span>
              </>
            )}
            {album.avgRating > 0 && (
              <>
                <span className="meta-dot">·</span>
                <Star size={12} fill="var(--warning)" color="var(--warning)" strokeWidth={1.5} />
                <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {album.avgRating.toFixed(1)}
                </span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button className="btn-primary" onClick={handlePlayAll} style={{ gap: 8 }}>
              {isAlbumPlaying
                ? <Pause size={15} strokeWidth={2} fill="currentColor" />
                : <Play size={15} strokeWidth={2} fill="currentColor" />
              }
              {isAlbumPlaying ? 'Pause' : 'Play All'}
            </button>
            <button className="btn-ghost" onClick={handleFav} style={{ gap: 8 }}>
              <Heart size={15} strokeWidth={1.5} />
              Favorite
            </button>
          </div>
        </div>
      </div>

      {/* ── Tracklist ── */}
      <div className="home-tracks-wrapper" style={{ paddingBottom: 40 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, marginBottom: 16 }}>
          Tracklist
        </h2>

        {!album.songs?.length ? (
          <div className="panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No songs in this album yet.
          </div>
        ) : (
          <div className="panel" style={{ padding: 8 }}>
            {album.songs.map((song, i) => {
              const isThisSongPlaying = currentSong?._id === song._id && isPlaying;
              const isThisSongLoaded = currentSong?._id === song._id;
              return (
                <div
                  key={song._id}
                  className={`track-row ${isThisSongLoaded ? 'playing' : ''}`}
                  onClick={() => handleSongClick(song, i)}
                >
                  <div className="track-num">
                    {isThisSongLoaded
                      ? <Equalizer isPlayingRow={isThisSongPlaying} />
                      : <span className="track-num-text">{i + 1}</span>
                    }
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div>
                      <div className="track-title" style={{ color: isThisSongLoaded ? 'var(--accent)' : 'inherit' }}>
                        {song.title}
                      </div>
                      <div className="track-artist-small">{album.artist}</div>
                    </div>
                  </div>
                  <div className="track-plays" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {song.playCount ? song.playCount.toLocaleString() : '—'}
                  </div>
                  <div className="track-duration">{fmt(song.duration)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Reviews ── */}
      <div className="album-detail-grid">
        {/* Review List */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, marginBottom: 16 }}>
            Reviews
            {reviews.length > 0 && (
              <span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginLeft: 10 }}>
                ({reviews.length})
              </span>
            )}
          </h2>

          {reviews.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No reviews yet. Be the first to share your thoughts!
            </div>
          ) : (
            <div className="panel" style={{ padding: '8px 16px' }}>
              {reviews.map((rev, i) => (
                <div key={rev._id || i} className="review-item">
                  <div className="review-header">
                    <div className="review-avatar">
                      {rev.user?.avatar
                        ? <img src={rev.user.avatar} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : (rev.user?.name?.[0] || '?').toUpperCase()
                      }
                    </div>
                    <div>
                      <div className="review-user-name">{rev.user?.name || 'Anonymous'}</div>
                      <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={12} strokeWidth={0}
                            fill={s <= rev.rating ? 'var(--warning)' : 'var(--glass-border)'}
                            color="transparent"
                          />
                        ))}
                      </div>
                    </div>
                    <span className="review-date">
                      {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {rev.review && <p className="review-text">{rev.review}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Write Review */}
        <aside>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, marginBottom: 16 }}>
            Leave a Review
          </h2>
          <div className="panel" style={{ padding: 24 }}>
            {user ? (
              <form onSubmit={handleSubmitReview} className="auth-form">
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Your Rating</label>
                  <StarPicker value={rating} onChange={setRating} />
                </div>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">Your Review</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share what you loved (or didn't)..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <User size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ marginBottom: 16, fontSize: 14 }}>Sign in to leave a review</p>
                <Link to="/login" className="btn-primary" style={{ justifyContent: 'center' }}>
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </motion.div>
  );
}
