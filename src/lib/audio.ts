class WebAudioPlayer {
  private ctx: AudioContext | null = null;
  private initialized = false;

  private init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  public playHover() {
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  public playClick() {
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.11);
  }
}

export const audioPlayer = new WebAudioPlayer();

// Hook to automatically attach sounds to the document
export const initializeGlobalSounds = () => {
  if (typeof document === 'undefined') return;

  const handleMouseOver = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'button' || target.closest('button') || target.tagName.toLowerCase() === 'a') {
      audioPlayer.playHover();
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'button' || target.closest('button') || target.tagName.toLowerCase() === 'a') {
      audioPlayer.playClick();
    }
  };

  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mousedown', handleMouseDown);

  return () => {
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('mousedown', handleMouseDown);
  };
};
