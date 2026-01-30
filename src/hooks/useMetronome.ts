import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MetronomeEngine } from '../audio/MetronomeEngine';
import { debug } from '../config';
import {
  NoteValue,
  TimeSignature,
  TwoMeasurePattern,
  ClickMode,
  getNotesPerMeasureForTimeSignature,
  getCompatibleNoteValues,
} from '../types';
import {
  getPatternAtIndex,
  createTwoMeasurePatternVariant,
  getVariantDisplayName,
  getTotalPatterns,
  getRandomPatternIndex,
  normalizePatternIndex,
  decomposePatternIndex,
  getVariantFromIndex,
  getBasePatternCount,
  PatternMode,
} from '../data/patterns';

export interface UseMetronomeReturn {
  // State
  isPlaying: boolean;
  bpm: number;
  noteValue: NoteValue;
  timeSignature: TimeSignature;
  currentBeatIndex: number;
  repeatCount: number;
  currentRepeat: number;
  patternMode: PatternMode;
  currentPatternIndex: number;
  nextPatternIndex: number;
  volume: number;
  clickMode: ClickMode;

  // Computed
  currentTwoMeasure: TwoMeasurePattern;
  nextTwoMeasure: TwoMeasurePattern;
  currentPatternName: string;
  nextPatternName: string;
  notesInMeasure: number;
  totalNotesInTwoMeasures: number;
  totalPatterns: number;
  compatibleNoteValues: NoteValue[];

  // Actions
  togglePlay: () => void;
  stop: () => void;
  setBpm: (bpm: number) => void;
  setNoteValue: (noteValue: NoteValue) => void;
  setTimeSignature: (timeSignature: TimeSignature) => void;
  setRepeatCount: (count: number) => void;
  setPatternMode: (mode: PatternMode) => void;
  setVolume: (volume: number) => void;
  setClickMode: (mode: ClickMode) => void;
  jumpToPattern: (index: number) => void;
  reset: () => void;
}

export function useMetronome(): UseMetronomeReturn {
  const engineRef = useRef<MetronomeEngine | null>(null);

  // Core state
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpmState] = useState(80);
  const [noteValue, setNoteValueState] = useState<NoteValue>('eighth');
  const [timeSignature, setTimeSignatureState] = useState<TimeSignature>('4/4');
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);
  const [repeatCount, setRepeatCountState] = useState(4);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [volume, setVolumeState] = useState(0.5);
  const [clickMode, setClickModeState] = useState<ClickMode>('every-note');

  // Pattern state
  const [patternMode, setPatternModeState] = useState<PatternMode>('sequential');
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [nextPatternIndex, setNextPatternIndex] = useState(1);

  // Refs to track values for use in callbacks (avoids stale closure issues)
  const nextPatternRef = useRef(1);
  const currentRepeatRef = useRef(1);

  // Keep currentRepeatRef in sync with state
  currentRepeatRef.current = currentRepeat;

  // Track which transition we've processed to prevent double-firing
  const lastProcessedCurrentRef = useRef(-1);

  // DEBUG: Log state changes
  debug.log('RENDER - currentPatternIndex:', currentPatternIndex, 'nextPatternIndex:', nextPatternIndex, 'currentRepeat:', currentRepeat);

  // Calculate notes in measure based on time signature
  const notesInMeasure = useMemo(
    () => getNotesPerMeasureForTimeSignature(noteValue, timeSignature),
    [noteValue, timeSignature]
  );

  // Total notes in two measures (for the combined display)
  const totalNotesInTwoMeasures = notesInMeasure * 2;

  // Calculate total patterns for current measure length
  const totalPatterns = useMemo(
    () => getTotalPatterns(notesInMeasure),
    [notesInMeasure]
  );

  // Get compatible note values for current time signature
  const compatibleNoteValues = useMemo(
    () => getCompatibleNoteValues(timeSignature),
    [timeSignature]
  );

  // Generate current and next two-measure patterns using the variant system
  const currentTwoMeasure = useMemo(() => {
    const normalizedIndex = normalizePatternIndex(currentPatternIndex, notesInMeasure);
    const { baseIndex, variantIndex } = decomposePatternIndex(normalizedIndex);
    const normalizedBase = ((baseIndex % getBasePatternCount(notesInMeasure)) + getBasePatternCount(notesInMeasure)) % getBasePatternCount(notesInMeasure);
    const pattern = getPatternAtIndex(normalizedBase, notesInMeasure);
    const variant = getVariantFromIndex(variantIndex);
    return createTwoMeasurePatternVariant(pattern, variant);
  }, [currentPatternIndex, notesInMeasure]);

  const nextTwoMeasure = useMemo(() => {
    const normalizedIndex = normalizePatternIndex(nextPatternIndex, notesInMeasure);
    const { baseIndex, variantIndex } = decomposePatternIndex(normalizedIndex);
    const normalizedBase = ((baseIndex % getBasePatternCount(notesInMeasure)) + getBasePatternCount(notesInMeasure)) % getBasePatternCount(notesInMeasure);
    const pattern = getPatternAtIndex(normalizedBase, notesInMeasure);
    const variant = getVariantFromIndex(variantIndex);
    return createTwoMeasurePatternVariant(pattern, variant);
  }, [nextPatternIndex, notesInMeasure]);

  // Get pattern names (includes variant info)
  const currentPatternName = useMemo(
    () => getVariantDisplayName(normalizePatternIndex(currentPatternIndex, notesInMeasure), notesInMeasure),
    [currentPatternIndex, notesInMeasure]
  );

  const nextPatternName = useMemo(
    () => getVariantDisplayName(normalizePatternIndex(nextPatternIndex, notesInMeasure), notesInMeasure),
    [nextPatternIndex, notesInMeasure]
  );

  // Initialize engine
  useEffect(() => {
    engineRef.current = new MetronomeEngine();
    engineRef.current.setBpm(bpm);
    engineRef.current.setNoteValue(noteValue);
    engineRef.current.setVolume(volume);
    engineRef.current.setTimeSignature(timeSignature);
    engineRef.current.setClickMode(clickMode);
    engineRef.current.setTwoMeasureMode(true);

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  // Set up callbacks
  useEffect(() => {
    if (!engineRef.current) return;

    engineRef.current.setCallbacks({
      onBeat: (beatIndex: number) => {
        setCurrentBeatIndex(beatIndex);
      },
      onMeasureComplete: () => {
        const currentRepeatValue = currentRepeatRef.current;
        debug.log('=== onMeasureComplete CALLED ===');
        debug.log('currentRepeatRef:', currentRepeatValue, 'repeatCount:', repeatCount);

        // Check if we need to advance to next pattern
        if (currentRepeatValue >= repeatCount) {
          debug.log('TRANSITION TRIGGERED');

          // Get the next pattern that should become current
          const oldNext = nextPatternRef.current;
          debug.log('oldNext (will become current):', oldNext);

          // Guard against double-firing
          if (lastProcessedCurrentRef.current === oldNext) {
            debug.log('GUARD TRIGGERED - skipping duplicate');
            return;
          }
          lastProcessedCurrentRef.current = oldNext;

          // Calculate new next
          let newNext: number;
          if (patternMode === 'random') {
            newNext = getRandomPatternIndex(notesInMeasure);
          } else {
            newNext = normalizePatternIndex(oldNext + 1, notesInMeasure);
          }
          debug.log('newNext calculated:', newNext);

          // Update ref BEFORE state updates
          nextPatternRef.current = newNext;

          // Update all state together
          debug.log('Setting currentPatternIndex to:', oldNext);
          debug.log('Setting nextPatternIndex to:', newNext);
          setCurrentPatternIndex(oldNext);
          setNextPatternIndex(newNext);
          setCurrentRepeat(1);
        } else {
          // Just increment the repeat counter
          debug.log('Incrementing repeat to:', currentRepeatValue + 1);
          setCurrentRepeat(currentRepeatValue + 1);
        }
      },
    });
  }, [repeatCount, patternMode, notesInMeasure]);

  // Sync engine state
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setBpm(bpm);
    }
  }, [bpm]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setNoteValue(noteValue);
    }
  }, [noteValue]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTimeSignature(timeSignature);
    }
  }, [timeSignature]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setClickMode(clickMode);
    }
  }, [clickMode]);

  // Reset pattern indices when notes in measure changes
  useEffect(() => {
    nextPatternRef.current = 1;
    lastProcessedCurrentRef.current = -1;
    setCurrentPatternIndex(0);
    setNextPatternIndex(1);
    setCurrentRepeat(1);
  }, [notesInMeasure]);

  // Actions
  const togglePlay = useCallback(async () => {
    if (!engineRef.current) return;

    if (isPlaying) {
      engineRef.current.stop();
      setIsPlaying(false);
    } else {
      await engineRef.current.start();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const stop = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.stop();
    setIsPlaying(false);
    setCurrentBeatIndex(0);
  }, []);

  const setBpm = useCallback((newBpm: number) => {
    setBpmState(Math.max(20, Math.min(300, newBpm)));
  }, []);

  const setNoteValue = useCallback((newNoteValue: NoteValue) => {
    setNoteValueState(newNoteValue);
    setCurrentBeatIndex(0);
  }, []);

  const setTimeSignature = useCallback((newTimeSignature: TimeSignature) => {
    setTimeSignatureState(newTimeSignature);
    setCurrentBeatIndex(0);
  }, []);

  const setRepeatCount = useCallback((count: number) => {
    setRepeatCountState(Math.max(1, Math.min(32, count)));
  }, []);

  const setPatternMode = useCallback((mode: PatternMode) => {
    setPatternModeState(mode);
    if (mode === 'random') {
      const newNext = getRandomPatternIndex(notesInMeasure);
      nextPatternRef.current = newNext;
      setNextPatternIndex(newNext);
    }
  }, [notesInMeasure]);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(Math.max(0, Math.min(1, vol)));
  }, []);

  const setClickMode = useCallback((mode: ClickMode) => {
    setClickModeState(mode);
  }, []);

  const jumpToPattern = useCallback((index: number) => {
    const normalized = normalizePatternIndex(index, notesInMeasure);
    const nextNormalized = normalizePatternIndex(normalized + 1, notesInMeasure);
    nextPatternRef.current = nextNormalized;
    lastProcessedCurrentRef.current = -1;
    setCurrentPatternIndex(normalized);
    setNextPatternIndex(nextNormalized);
    setCurrentRepeat(1);
  }, [notesInMeasure]);

  const reset = useCallback(() => {
    stop();
    setCurrentBeatIndex(0);
    nextPatternRef.current = 1;
    lastProcessedCurrentRef.current = -1;
    setCurrentPatternIndex(0);
    setNextPatternIndex(1);
    setCurrentRepeat(1);
  }, [stop]);

  return {
    // State
    isPlaying,
    bpm,
    noteValue,
    timeSignature,
    currentBeatIndex,
    repeatCount,
    currentRepeat,
    patternMode,
    currentPatternIndex,
    nextPatternIndex,
    volume,
    clickMode,

    // Computed
    currentTwoMeasure,
    nextTwoMeasure,
    currentPatternName,
    nextPatternName,
    notesInMeasure,
    totalNotesInTwoMeasures,
    totalPatterns,
    compatibleNoteValues,

    // Actions
    togglePlay,
    stop,
    setBpm,
    setNoteValue,
    setTimeSignature,
    setRepeatCount,
    setPatternMode,
    setVolume,
    setClickMode,
    jumpToPattern,
    reset,
  };
}
