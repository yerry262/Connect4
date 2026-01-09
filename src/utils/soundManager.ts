// Sound manager for Connect4 game
class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private isSoundEnabled: boolean = true;
  private isMusicEnabled: boolean = true;

  constructor() {
    // Initialize default sounds
    this.initSounds();
  }

  private initSounds() {
    // Create audio elements for different sounds
    this.sounds.set('pieceDrop', new Audio('/audio/piece-drop.mp3'));
    this.sounds.set('win', new Audio('/audio/win.mp3'));
    this.sounds.set('casinoWin', new Audio('/audio/casino-win.mp3'));
    this.sounds.set('buttonClick', new Audio('/audio/button-click.mp3'));
    this.sounds.set('backgroundMusic', new Audio('/audio/background-music.mp3'));
    
    // Set default audio properties
    for (const [key, audio] of this.sounds.entries()) {
      audio.volume = 0.5;
      audio.loop = key === 'backgroundMusic';
      
      // Handle errors for missing files
      audio.addEventListener('error', () => {
        console.warn(`Audio file for ${key} not found`);
      });
    }
    
    // Configure background music specifically
    const bgMusic = this.sounds.get('backgroundMusic');
    if (bgMusic) {
      bgMusic.loop = true;
      bgMusic.volume = 0.3;
    }
  }

  enableSound(enabled: boolean) {
    this.isSoundEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    }
  }

  enableMusic(enabled: boolean) {
    this.isMusicEnabled = enabled;
    if (enabled && this.isSoundEnabled) {
      this.playBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }
  }

  playSound(soundName: string) {
    if (!this.isSoundEnabled) return;
    
    const audio = this.sounds.get(soundName);
    if (audio) {
      // Reset audio to start if already playing
      audio.currentTime = 0;
      audio.play().catch(e => console.warn(`Failed to play ${soundName}:`, e));
    }
  }

  playPieceDrop() {
    this.playSound('pieceDrop');
  }

  playWinSound() {
    this.playSound('win');
    this.playSound('casinoWin');
  }

  playButtonClick() {
    this.playSound('buttonClick');
  }

  playBackgroundMusic() {
    if (!this.isMusicEnabled || !this.isSoundEnabled) return;
    
    const bgMusic = this.sounds.get('backgroundMusic');
    if (bgMusic && bgMusic.paused) {
      bgMusic.play().catch(e => console.warn('Failed to play background music:', e));
    }
  }

  stopBackgroundMusic() {
    const bgMusic = this.sounds.get('backgroundMusic');
    if (bgMusic && !bgMusic.paused) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
  }

  // Cleanup method
  destroy() {
    this.stopBackgroundMusic();
    this.sounds.clear();
  }
}

// Create a singleton instance
export const soundManager = new SoundManager();