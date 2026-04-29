import { createSlice } from '@reduxjs/toolkit';

const playerSlice = createSlice({
  name: 'player',
  initialState: {
    currentSong: null,
    queue: [],
    queueIndex: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    shuffle: false,
    repeat: 'off', // 'off', 'one', 'all'
    isExpanded: false,
    isVisible: false,
  },
  reducers: {
    playSong: (state, action) => {
      const { song, queue, index } = action.payload;
      state.currentSong = song;
      state.queue = queue || [song];
      state.queueIndex = index !== undefined ? index : state.queue.findIndex(s => s._id === song._id);
      state.isPlaying = true;
      state.isVisible = true;
      state.isExpanded = false; // Mini bar only; user clicks to expand
    },
    togglePlay: (state) => {
      if (state.currentSong) {
        state.isPlaying = !state.isPlaying;
      }
    },
    setPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    nextSong: (state) => {
      if (state.queue.length === 0) return;
      
      let nextIndex;
      if (state.shuffle) {
        nextIndex = Math.floor(Math.random() * state.queue.length);
      } else {
        nextIndex = (state.queueIndex + 1) % state.queue.length;
        if (nextIndex === 0 && state.repeat === 'off') {
          state.isPlaying = false;
          return;
        }
      }
      
      state.queueIndex = nextIndex;
      state.currentSong = state.queue[nextIndex];
      state.isPlaying = true;
    },
    prevSong: (state) => {
      if (state.queue.length === 0) return;
      
      // If more than 3 seconds played, restart song (handled in component usually, but logic here for index)
      let prevIndex = (state.queueIndex - 1 + state.queue.length) % state.queue.length;
      state.queueIndex = prevIndex;
      state.currentSong = state.queue[prevIndex];
      state.isPlaying = true;
    },
    setCurrentTime: (state, action) => {
      state.currentTime = action.payload;
    },
    setDuration: (state, action) => {
      state.duration = action.payload;
    },
    setVolume: (state, action) => {
      state.volume = action.payload;
      state.isMuted = action.payload === 0;
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    toggleShuffle: (state) => {
      state.shuffle = !state.shuffle;
    },
    cycleRepeat: (state) => {
      const modes = ['off', 'all', 'one'];
      const nextIdx = (modes.indexOf(state.repeat) + 1) % modes.length;
      state.repeat = modes[nextIdx];
    },
    setExpanded: (state, action) => {
      state.isExpanded = action.payload;
    },
    setVisibility: (state, action) => {
      state.isVisible = action.payload;
    },
  },
});

export const {
  playSong, togglePlay, setPlaying, nextSong, prevSong,
  setCurrentTime, setDuration, setVolume, toggleMute,
  toggleShuffle, cycleRepeat, setExpanded, setVisibility
} = playerSlice.actions;

export const selectPlayer = (state) => state.player;
export default playerSlice.reducer;
