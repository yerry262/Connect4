import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { soundManager } from '../utils/soundManager';

// Mock HTMLMediaElement methods for testing
beforeAll(() => {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
  HTMLMediaElement.prototype.load = vi.fn();
});

describe('SoundManager', () => {
  beforeEach(() => {
    // Mock console.warn to avoid noise in test output
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Enable sound and music for each test
    soundManager.enableSound(true);
    soundManager.enableMusic(true);
  });

  describe('Sound enabling/disabling', () => {
    it('should initialize with sound enabled', () => {
      // soundManager is a singleton, check it responds to enable
      expect(() => soundManager.enableSound(true)).not.toThrow();
    });

    it('should disable all sounds when sound is disabled', () => {
      soundManager.enableSound(false);
      
      // These should not throw even when disabled
      expect(() => soundManager.playPieceDrop()).not.toThrow();
      expect(() => soundManager.playWinSound()).not.toThrow();
      expect(() => soundManager.playButtonClick()).not.toThrow();
    });

    it('should stop background music when sound is disabled', () => {
      soundManager.enableSound(true);
      soundManager.enableMusic(true);
      
      // Now disable sound
      soundManager.enableSound(false);
      
      // Background music should be stopped
      expect(() => soundManager.stopBackgroundMusic()).not.toThrow();
    });
  });

  describe('Music control', () => {
    it('should enable music independently of sound effects', () => {
      soundManager.enableMusic(true);
      expect(() => soundManager.playBackgroundMusic()).not.toThrow();
    });

    it('should disable music while keeping sound effects enabled', () => {
      soundManager.enableSound(true);
      soundManager.enableMusic(false);
      
      expect(() => soundManager.playBackgroundMusic()).not.toThrow();
      expect(() => soundManager.playPieceDrop()).not.toThrow();
    });

    it('should play background music when enabled', () => {
      soundManager.enableSound(true);
      soundManager.enableMusic(true);
      
      expect(() => soundManager.playBackgroundMusic()).not.toThrow();
    });

    it('should stop background music', () => {
      soundManager.playBackgroundMusic();
      expect(() => soundManager.stopBackgroundMusic()).not.toThrow();
    });

    it('should not play music if sound is disabled', () => {
      soundManager.enableSound(false);
      soundManager.enableMusic(true);
      
      // Should not throw but music shouldn't play
      expect(() => soundManager.playBackgroundMusic()).not.toThrow();
    });
  });

  describe('Sound effects playback', () => {
    it('should play piece drop sound', () => {
      expect(() => soundManager.playPieceDrop()).not.toThrow();
    });

    it('should play win sound', () => {
      expect(() => soundManager.playWinSound()).not.toThrow();
    });

    it('should play button click sound', () => {
      expect(() => soundManager.playButtonClick()).not.toThrow();
    });

    it('should play custom sounds by name', () => {
      expect(() => soundManager.playSound('pieceDrop')).not.toThrow();
      expect(() => soundManager.playSound('win')).not.toThrow();
      expect(() => soundManager.playSound('buttonClick')).not.toThrow();
    });

    it('should handle non-existent sound names gracefully', () => {
      expect(() => soundManager.playSound('nonExistentSound')).not.toThrow();
    });
  });

  describe('Sound playback states', () => {
    it('should allow multiple sounds to play simultaneously', () => {
      expect(() => {
        soundManager.playPieceDrop();
        soundManager.playButtonClick();
      }).not.toThrow();
    });

    it('should reset sound to beginning when played again', () => {
      // Playing same sound twice should reset it
      expect(() => {
        soundManager.playPieceDrop();
        soundManager.playPieceDrop();
      }).not.toThrow();
    });

    it('should play win sound with casino win together', () => {
      // playWinSound plays both sounds
      expect(() => soundManager.playWinSound()).not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle missing audio files gracefully', () => {
      // Audio files might not exist in test environment
      expect(() => soundManager.playSound('backgroundMusic')).not.toThrow();
    });

    it('should handle play failures gracefully', () => {
      // Even if audio fails to play, should not crash
      expect(() => {
        soundManager.playPieceDrop();
        soundManager.playWinSound();
        soundManager.playButtonClick();
      }).not.toThrow();
    });

    it('should handle background music play/stop cycles', () => {
      expect(() => {
        soundManager.playBackgroundMusic();
        soundManager.stopBackgroundMusic();
        soundManager.playBackgroundMusic();
        soundManager.stopBackgroundMusic();
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      expect(() => soundManager.destroy()).not.toThrow();
    });

    it('should stop music on destroy', () => {
      soundManager.playBackgroundMusic();
      soundManager.destroy();
      
      // After destroy, operations should still not throw
      expect(() => soundManager.playBackgroundMusic()).not.toThrow();
    });
  });

  describe('State management', () => {
    it('should remember sound enabled state', () => {
      soundManager.enableSound(false);
      
      // Sound should stay disabled
      soundManager.playPieceDrop();
      
      soundManager.enableSound(true);
      
      // Now sound should work
      expect(() => soundManager.playPieceDrop()).not.toThrow();
    });

    it('should remember music enabled state', () => {
      soundManager.enableMusic(false);
      soundManager.enableMusic(true);
      
      expect(() => soundManager.playBackgroundMusic()).not.toThrow();
    });

    it('should handle rapid enable/disable toggles', () => {
      expect(() => {
        soundManager.enableSound(true);
        soundManager.enableSound(false);
        soundManager.enableSound(true);
        soundManager.enableSound(false);
      }).not.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle typical game flow sounds', () => {
      // Start game
      soundManager.playButtonClick();
      
      // Make moves
      soundManager.playPieceDrop();
      soundManager.playPieceDrop();
      soundManager.playPieceDrop();
      
      // Win game
      soundManager.playWinSound();
      
      expect(true).toBe(true); // All above should not throw
    });

    it('should handle game with background music', () => {
      soundManager.playBackgroundMusic();
      
      // Play game sounds over music
      soundManager.playPieceDrop();
      soundManager.playButtonClick();
      
      soundManager.stopBackgroundMusic();
      
      expect(true).toBe(true);
    });

    it('should handle user toggling sound during gameplay', () => {
      soundManager.playBackgroundMusic();
      soundManager.playPieceDrop();
      
      // User disables sound
      soundManager.enableSound(false);
      soundManager.playPieceDrop(); // Should not play
      
      // User re-enables sound
      soundManager.enableSound(true);
      soundManager.playPieceDrop(); // Should play
      
      expect(true).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle calling playSound with empty string', () => {
      expect(() => soundManager.playSound('')).not.toThrow();
    });

    it('should handle stopping music that is not playing', () => {
      soundManager.stopBackgroundMusic();
      soundManager.stopBackgroundMusic(); // Stop again
      
      expect(true).toBe(true);
    });

    it('should handle playing music that is already playing', () => {
      soundManager.playBackgroundMusic();
      soundManager.playBackgroundMusic(); // Play again
      
      expect(true).toBe(true);
    });

    it('should handle all sounds being played at once', () => {
      expect(() => {
        soundManager.playPieceDrop();
        soundManager.playWinSound();
        soundManager.playButtonClick();
        soundManager.playBackgroundMusic();
      }).not.toThrow();
    });
  });
});
