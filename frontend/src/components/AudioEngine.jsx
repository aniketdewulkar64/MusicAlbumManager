import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  selectPlayer, 
  setCurrentTime, 
  setDuration, 
  nextSong, 
  prevSong,
  setPlaying,
  togglePlay,
  toggleMute,
  setExpanded
} from '../store/slices/playerSlice';

export default function AudioEngine() {
  const audioRef = useRef(null);
  const dispatch = useDispatch();
  const lastUpdate = useRef(0);
  const { currentSong, isPlaying, volume, isMuted, repeat, isExpanded } = useSelector(selectPlayer);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate.current > 250) {
        dispatch(setCurrentTime(audio.currentTime));
        lastUpdate.current = now;
      }
    };

    const handleLoadedMetadata = () => dispatch(setDuration(audio.duration));
    
    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        dispatch(nextSong());
      }
    };

    const handleError = (e) => {
      // Prevent showing multiple errors for the same song source
      const audio = audioRef.current;
      if (audio && audio.src && !audio.src.includes('undefined')) {
        console.error('Audio Error:', e);
        toast.error('Unable to play this track. Please check your connection or try another song.', {
          toastId: `audio-error-${audio.src}` // Prevent duplicates
        });
      }
      dispatch(setPlaying(false));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Keyboard Shortcuts
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          dispatch(togglePlay());
          break;
        case 'arrowright':
          audio.currentTime = Math.min(audio.currentTime + 10, audio.duration);
          break;
        case 'arrowleft':
          audio.currentTime = Math.max(audio.currentTime - 10, 0);
          break;
        case 'n':
          dispatch(nextSong());
          break;
        case 'p':
          if (audio.currentTime > 3) {
            audio.currentTime = 0;
          } else {
            dispatch(prevSong());
          }
          break;
        case 'm':
          dispatch(toggleMute());
          break;
        case 'f':
          dispatch(setExpanded(!isExpanded));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, repeat, isExpanded]);

  // Handle source changes
  useEffect(() => {
    const audioUrl = currentSong?.audioFile || currentSong?.audioUrl;
    if (audioUrl) {
      const audio = audioRef.current;
      let finalUrl = audioUrl;
      
      // Handle relative paths
      if (!finalUrl.startsWith('http') && !finalUrl.startsWith('blob:')) {
        // Ensure path starts with / so it hits the Vite proxy correctly
        if (!finalUrl.startsWith('/')) finalUrl = '/' + finalUrl;
      }

      console.log('Final Audio URL:', finalUrl);

      if (audio.src !== finalUrl) {
        audio.src = finalUrl;
        audio.load();
      }
      if (isPlaying) {
        audio.play().catch(err => {
          console.warn('Playback prevented or failed:', err);
          // Only stop playing if it's a real error, not a promise cancellation
          if (err.name !== 'AbortError') dispatch(setPlaying(false));
        });
      }
    }
  }, [currentSong, dispatch, isPlaying]);

  // Handle play/pause state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      if (audioRef.current.src) {
        audioRef.current.play().catch(() => dispatch(setPlaying(false)));
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, dispatch]);

  // Handle volume and mute
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current.muted = isMuted;
  }, [volume, isMuted]);

  return <audio ref={audioRef} id="main-audio" style={{ display: 'none' }} crossOrigin="anonymous" />;
}
