import { useSelector } from 'react-redux';
import { selectPlayer } from '../store/slices/playerSlice';

export default function Equalizer({ isPlayingRow }) {
  const { isPlaying } = useSelector(selectPlayer);

  return (
    <div className={`eq-container ${!isPlaying || !isPlayingRow ? 'eq-paused' : ''}`}>
      <div className="eq-bar eq-bar-1" />
      <div className="eq-bar eq-bar-2" />
      <div className="eq-bar eq-bar-3" />
    </div>
  );
}
