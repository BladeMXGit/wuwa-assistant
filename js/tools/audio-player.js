/**
 * Wuthering Waves - Background Audio Controller
 * Provides dual-mode audio:
 * 1. Web Audio API Ambient Synthesizer (Zero buffering, 100% offline, soothing Solaris-3 pentatonic resonance).
 * 2. Official Kuro Games OST Player (Embedded YouTube stream).
 */

class WuWaAudioController {
  constructor() {
    this.isPlaying = false;
    this.currentMode = 'synth'; // 'synth' | 'ost'
    this.volume = 0.45;
    this.audioCtx = null;
    this.synthInterval = null;
    this.ytPlayer = null;
    this.ytReady = false;

    // Pentatonic scale frequencies for Jinzhou / Solaris-3 resonance (D major pentatonic: D, E, F#, A, B across 2 octaves)
    this.scale = [146.83, 164.81, 185.00, 220.00, 246.94, 293.66, 329.63, 369.99, 440.00, 493.88, 587.33];
  }

  init() {
    this.setupUI();
    this.setupYouTubeAPI();
  }

  setupUI() {
    this.playBtn = document.getElementById('btn-bgm-play');
    this.trackName = document.getElementById('bgm-track-title');
    this.volumeSlider = document.getElementById('bgm-volume-slider');
    this.modeBtn = document.getElementById('btn-bgm-mode');
    this.visualizerBars = document.querySelectorAll('.bgm-equalizer-bar');

    this.playBtn?.addEventListener('click', () => this.togglePlay());
    this.modeBtn?.addEventListener('click', () => this.toggleMode());

    this.volumeSlider?.addEventListener('input', (e) => {
      this.volume = parseFloat(e.target.value);
      this.applyVolume();
    });
  }

  setupYouTubeAPI() {
    // Inject YouTube IFrame API script tag
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        this.createYTPlayer();
      };
    } else {
      this.createYTPlayer();
    }
  }

  createYTPlayer() {
    const container = document.getElementById('yt-audio-container');
    if (!container) return;

    this.ytPlayer = new window.YT.Player('yt-audio-container', {
      height: '1',
      width: '1',
      videoId: 'R8htow_6tRc', // Waking of a World (Official Main Theme)
      playerVars: {
        autoplay: 0,
        controls: 0,
        loop: 1,
        playlist: 'R8htow_6tRc',
        origin: window.location.origin
      },
      events: {
        onReady: () => {
          this.ytReady = true;
          if (this.ytPlayer.setVolume) {
            this.ytPlayer.setVolume(this.volume * 100);
          }
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            this.setVisualizerActive(true);
          } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
            if (this.currentMode === 'ost') {
              this.setVisualizerActive(false);
            }
          }
        }
      }
    });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.isPlaying = true;
    this.updatePlayBtn(true);

    if (this.currentMode === 'synth') {
      this.startSynth();
      this.setTrackTitle('Resonancia Acústica de Solaris-3 (Ambiente)');
    } else {
      this.startOST();
      this.setTrackTitle('Waking of a World (OST Oficial Kuro Games)');
    }

    this.setVisualizerActive(true);
  }

  pause() {
    this.isPlaying = false;
    this.updatePlayBtn(false);

    if (this.currentMode === 'synth') {
      this.stopSynth();
    } else {
      this.stopOST();
    }

    this.setVisualizerActive(false);
  }

  toggleMode() {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }

    if (this.currentMode === 'synth') {
      this.currentMode = 'ost';
      if (this.modeBtn) this.modeBtn.textContent = 'MODO: OST OFICIAL';
      this.setTrackTitle('Waking of a World (OST Kuro Games)');
    } else {
      this.currentMode = 'synth';
      if (this.modeBtn) this.modeBtn.textContent = 'MODO: SINTETIZADOR AMBIENTAL';
      this.setTrackTitle('Resonancia Acústica de Solaris-3');
    }

    if (wasPlaying) {
      this.play();
    }
  }

  applyVolume() {
    if (this.currentMode === 'synth' && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume * 0.4, this.audioCtx.currentTime);
    }
    if (this.currentMode === 'ost' && this.ytPlayer && this.ytPlayer.setVolume) {
      this.ytPlayer.setVolume(this.volume * 100);
    }
  }

  /* ==========================================================================
     Web Audio API Synthesizer (Solaris-3 Ambient Resonance)
     ========================================================================== */

  startSynth() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    // Master Gain
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume * 0.4, this.audioCtx.currentTime);

    // Warm Lowpass Filter
    this.filter = this.audioCtx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(900, this.audioCtx.currentTime);
    this.masterGain.connect(this.filter);
    this.filter.connect(this.audioCtx.destination);

    // Drone Pad 1 (Deep Fundamental D)
    this.droneOsc = this.audioCtx.createOscillator();
    this.droneGain = this.audioCtx.createGain();
    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.setValueAtTime(73.42, this.audioCtx.currentTime); // D2
    this.droneGain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);
    this.droneOsc.start();

    // Drone Pad 2 (Harmonic Fifth A)
    this.drone5Osc = this.audioCtx.createOscillator();
    this.drone5Gain = this.audioCtx.createGain();
    this.drone5Osc.type = 'triangle';
    this.drone5Osc.frequency.setValueAtTime(110.00, this.audioCtx.currentTime); // A2
    this.drone5Gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
    this.drone5Osc.connect(this.drone5Gain);
    this.drone5Gain.connect(this.masterGain);
    this.drone5Osc.start();

    // Random acoustic chimes scheduler (Guzheng-like harmonics)
    this.playRandomChime();
    this.synthInterval = setInterval(() => {
      if (this.isPlaying && this.currentMode === 'synth') {
        this.playRandomChime();
      }
    }, 1800);
  }

  playRandomChime() {
    if (!this.audioCtx || this.audioCtx.state !== 'running') return;

    const freq = this.scale[Math.floor(Math.random() * this.scale.length)];
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = Math.random() > 0.4 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

    const now = this.audioCtx.currentTime;
    const dur = 2.5 + Math.random() * 2.0;

    // Bell envelope: sharp attack, gentle harmonic decay
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + dur);
  }

  stopSynth() {
    clearInterval(this.synthInterval);
    try {
      if (this.droneOsc) {
        this.droneOsc.stop();
        this.droneOsc.disconnect();
      }
      if (this.drone5Osc) {
        this.drone5Osc.stop();
        this.drone5Osc.disconnect();
      }
      if (this.audioCtx) {
        this.audioCtx.suspend();
      }
    } catch (e) {
      console.warn('Audio cleanup:', e);
    }
  }

  /* ==========================================================================
     YouTube Official OST Streaming
     ========================================================================== */

  startOST() {
    if (this.ytPlayer && this.ytReady && this.ytPlayer.playVideo) {
      this.ytPlayer.playVideo();
    }
  }

  stopOST() {
    if (this.ytPlayer && this.ytReady && this.ytPlayer.pauseVideo) {
      this.ytPlayer.pauseVideo();
    }
  }

  /* ==========================================================================
     UI State Updates
     ========================================================================== */

  updatePlayBtn(playing) {
    if (!this.playBtn) return;
    if (playing) {
      this.playBtn.innerHTML = '<span>⏸</span> <span>PAUSAR</span>';
      this.playBtn.classList.add('playing');
    } else {
      this.playBtn.innerHTML = '<span>▶</span> <span>MÚSICA</span>';
      this.playBtn.classList.remove('playing');
    }
  }

  setTrackTitle(title) {
    if (this.trackName) {
      this.trackName.textContent = title;
    }
  }

  setVisualizerActive(active) {
    this.visualizerBars.forEach(bar => {
      if (active) {
        bar.classList.add('animating');
      } else {
        bar.classList.remove('animating');
      }
    });
  }
}

export const audioController = new WuWaAudioController();
