import { NoteValue, TimeSignature, ClickMode, TIME_SIGNATURE_CONFIGS, getNotesPerBeat } from '../types';

export interface MetronomeEngineCallbacks {
  onBeat: (beatIndex: number) => void;
  onMeasureComplete: () => void;
}

export class MetronomeEngine {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;
  private bpm = 120;
  private noteValue: NoteValue = 'eighth';
  private timeSignature: TimeSignature = '4/4';
  private beatsPerMeasure = 4;
  private currentBeat = 0;
  private notesInMeasure = 8;
  private twoMeasureMode = false;
  private clickMode: ClickMode = 'every-note';

  private nextNoteTime = 0;
  private scheduleAheadTime = 0.1;
  private lookaheadInterval = 25;
  private timerID: number | null = null;

  private callbacks: MetronomeEngineCallbacks | null = null;

  // Audio settings
  private clickFrequencyHigh = 1000;
  private clickFrequencyLow = 800;
  private clickDuration = 0.05;
  private volume = 0.5;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }

  public setCallbacks(callbacks: MetronomeEngineCallbacks): void {
    this.callbacks = callbacks;
  }

  public setBpm(bpm: number): void {
    this.bpm = Math.max(20, Math.min(300, bpm));
  }

  public getBpm(): number {
    return this.bpm;
  }

  public setNoteValue(noteValue: NoteValue): void {
    this.noteValue = noteValue;
    this.updateNotesInMeasure();
  }

  public setTimeSignature(timeSignature: TimeSignature): void {
    this.timeSignature = timeSignature;
    const config = TIME_SIGNATURE_CONFIGS[timeSignature];
    this.beatsPerMeasure = config.beatsPerMeasure;
    this.updateNotesInMeasure();
  }

  public setTwoMeasureMode(enabled: boolean): void {
    this.twoMeasureMode = enabled;
  }

  public setClickMode(mode: ClickMode): void {
    this.clickMode = mode;
  }

  public setBeatsPerMeasure(beats: number): void {
    this.beatsPerMeasure = beats;
    this.updateNotesInMeasure();
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  private updateNotesInMeasure(): void {
    const notesPerBeat = getNotesPerBeat(this.noteValue);
    this.notesInMeasure = Math.floor(notesPerBeat * this.beatsPerMeasure);
  }

  public getNotesInMeasure(): number {
    return this.notesInMeasure;
  }

  private getTotalNotesInCycle(): number {
    return this.twoMeasureMode ? this.notesInMeasure * 2 : this.notesInMeasure;
  }

  private getNoteInterval(): number {
    const notesPerBeat = getNotesPerBeat(this.noteValue);
    const beatDuration = 60.0 / this.bpm;
    return beatDuration / notesPerBeat;
  }

  private shouldPlayClick(beatIndex: number): boolean {
    if (this.clickMode === 'every-note') {
      return true;
    }

    // quarter-only mode: only play on quarter note boundaries
    const notesPerBeat = getNotesPerBeat(this.noteValue);

    // Get position within the current logical measure
    const positionInMeasure = beatIndex % this.notesInMeasure;

    // Quarter note boundary is when position is divisible by notesPerBeat
    return positionInMeasure % notesPerBeat === 0;
  }

  private scheduleNote(time: number, beatIndex: number): void {
    if (!this.audioContext) return;

    const config = TIME_SIGNATURE_CONFIGS[this.timeSignature];
    const notesPerBeat = getNotesPerBeat(this.noteValue);
    const totalNotes = this.getTotalNotesInCycle();

    // Calculate position within the current single measure
    const positionInMeasure = beatIndex % this.notesInMeasure;

    // Determine downbeat and strong beat status
    const isDownbeat = beatIndex === 0;
    const isMeasure2Downbeat = this.twoMeasureMode && beatIndex === this.notesInMeasure;

    let isStrongBeat = false;
    if (config.isCompound) {
      // For 6/8, strong beats at 0 and halfway through each measure
      const halfMeasure = Math.floor(this.notesInMeasure / 2);
      isStrongBeat = positionInMeasure === 0 || positionInMeasure === halfMeasure;
    } else {
      // For simple time, every beat start is accented
      isStrongBeat = positionInMeasure % notesPerBeat === 0;
    }

    // Only play click sound if we should according to click mode
    const playClick = this.shouldPlayClick(beatIndex);

    if (playClick) {
      const osc = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      if (isDownbeat || isMeasure2Downbeat) {
        osc.frequency.value = this.clickFrequencyHigh;
        gainNode.gain.value = this.volume;
      } else if (isStrongBeat) {
        osc.frequency.value = this.clickFrequencyLow;
        gainNode.gain.value = this.volume * 0.8;
      } else {
        osc.frequency.value = this.clickFrequencyLow * 0.8;
        gainNode.gain.value = this.volume * 0.5;
      }

      gainNode.gain.setValueAtTime(gainNode.gain.value, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + this.clickDuration);

      osc.start(time);
      osc.stop(time + this.clickDuration);
    }

    // Schedule visual callback
    const currentTime = this.audioContext.currentTime;
    const delay = Math.max(0, (time - currentTime) * 1000);

    setTimeout(() => {
      if (this.callbacks && this.isPlaying) {
        this.callbacks.onBeat(beatIndex);

        // Check if cycle is complete (either 1 or 2 measures depending on mode)
        if (beatIndex === totalNotes - 1) {
          this.callbacks.onMeasureComplete();
        }
      }
    }, delay);
  }

  private scheduler(): void {
    if (!this.audioContext) return;

    const totalNotes = this.getTotalNotesInCycle();

    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.nextNoteTime, this.currentBeat);

      this.nextNoteTime += this.getNoteInterval();
      this.currentBeat = (this.currentBeat + 1) % totalNotes;
    }
  }

  public async start(): Promise<void> {
    if (this.isPlaying) return;

    this.initAudioContext();

    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.isPlaying = true;
    this.currentBeat = 0;
    this.updateNotesInMeasure();
    this.nextNoteTime = this.audioContext.currentTime + 0.05;

    this.timerID = window.setInterval(() => this.scheduler(), this.lookaheadInterval);
  }

  public stop(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    if (this.timerID !== null) {
      clearInterval(this.timerID);
      this.timerID = null;
    }

    this.currentBeat = 0;
  }

  public toggle(): Promise<void> {
    if (this.isPlaying) {
      this.stop();
      return Promise.resolve();
    } else {
      return this.start();
    }
  }

  public isRunning(): boolean {
    return this.isPlaying;
  }

  public getCurrentBeat(): number {
    return this.currentBeat;
  }

  public reset(): void {
    this.stop();
    this.currentBeat = 0;
  }

  public dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
