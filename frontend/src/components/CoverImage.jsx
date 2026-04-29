import { Music, User } from 'lucide-react';
import { useState } from 'react';

export default function CoverImage({ src, alt, size = '100%', rounded = 'md', className = '', type = 'song' }) {
  const [error, setError] = useState(false);

  const roundedClasses = {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    full: '50%',
  };

  const borderRadius = roundedClasses[rounded] || rounded;

  const Placeholder = () => (
    <div 
      className={`image-placeholder ${className}`}
      style={{ 
        width: size, 
        height: size, 
        borderRadius,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--glass-2)',
        border: '1px solid var(--glass-border)',
        gap: '8px'
      }}
    >
      {type === 'artist' ? (
        <User size={typeof size === 'number' ? size / 3 : 24} color="var(--text-muted)" strokeWidth={1.5} />
      ) : (
        <Music size={typeof size === 'number' ? size / 3 : 24} color="var(--text-muted)" strokeWidth={1.5} />
      )}
      {typeof size === 'number' && size > 60 && (
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          No Cover
        </span>
      )}
    </div>
  );

  if (!src || error) {
    return <Placeholder />;
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={className}
      style={{ 
        width: size, 
        height: size, 
        borderRadius, 
        objectFit: 'cover',
        display: 'block'
      }}
    />
  );
}
