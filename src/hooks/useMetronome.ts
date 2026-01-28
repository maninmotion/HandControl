import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MetronomeEngine } from '../audio/MetronomeEngine';
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
  createTwoMeasurePattern,
  getPatternDisplayName,
  getTotalPatterns,
  getRandomPatternIndex,
  normalizePatternIndex,
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

  // Generate current and next two-measure patterns
  const currentTwoMeasure = useMemo(() => {
    const normalizedIndex = normalizePatternIndex(currentPatternIndex, notesInMeasure);
    const pattern = getPatternAtIndex(normalizedIndex, notesInMeasure);
    return createTwoMeasurePattern(pattern);
  }, [currentPatternIndex, notesInMeasure]);

  const nextTwoMeasure = useMemo(() => {
    const normalizedIndex = normalizePatternIndex(nextPatternIndex, notesInMeasure);
    const pattern = getPatternAtIndex(normalizedIndex, notesInMeasure);
    return createTwoMeasurePattern(pattern);
  }, [nextPatternIndex, notesInMeasure]);

  // Get pattern names
  const currentPatternName = useMemo(
    () => getPatternDisplayName(currentTwoMeasure.measure1),
    [currentTwoMeasure]
  );

  const nextPatternName = useMemo(
    () => getPatternDisplayName(nextTwoMeasure.measure1),
    [nextTwoMeasure]
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
        // Called after both measures complete (2 measures worth of notes)
        setCurrentRepeat((prev) => {
          if (prev >= repeatCount) {
            // Completed all repeats, advance to next pattern
            setCurrentPatternIndex((idx) => {
              if (patternMode === 'random') {
                const newIdx = getRandomPatternIndex(notesInMeasure);
                setNextPatternIndex(getRandomPatternIndex(notesInMeasure));
                return newIdx;
              }
              const newIdx = normalizePatternIndex(idx + 1, notesInMeasure);
              setNextPatternIndex(normalizePatternIndex(newIdx + 1, notesInMeasure));
              return newIdx;
            });
            return 1;
          }
          return prev + 1;
        });
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
      setNextPatternIndex(getRandomPatternIndex(notesInMeasure));
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
    setCurrentPatternIndex(normalized);
    setNextPatternIndex(normalizePatternIndex(normalized + 1, notesInMeasure));
    setCurrentRepeat(1);
  }, [notesInMeasure]);

  const reset = useCallback(() => {
    stop();
    setCurrentBeatIndex(0);
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
