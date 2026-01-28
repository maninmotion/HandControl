export type Hand = 'L' | 'R';

export type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'eighth-triplet' | 'sixteenth-triplet';

export type TimeSignature = '4/4' | '3/4' | '2/4' | '6/8';

export type ClickMode = 'every-note' | 'quarter-only';

export interface TimeSignatureConfig {
  beatsPerMeasure: number;
  beatUnit: number;
  isCompound: boolean;
}

export const TIME_SIGNATURE_CONFIGS: Record<TimeSignature, TimeSignatureConfig> = {
  '4/4': { beatsPerMeasure: 4, beatUnit: 4, isCompound: false },
  '3/4': { beatsPerMeasure: 3, beatUnit: 4, isCompound: false },
  '2/4': { beatsPerMeasure: 2, beatUnit: 4, isCompound: false },
  '6/8': { beatsPerMeasure: 6, beatUnit: 8, isCompound: true },
};

export interface GeneratedPattern {
  id: number;
  sticking: Hand[];
}

export interface TwoMeasurePattern {
  measure1: GeneratedPattern;
  measure2: GeneratedPattern;
}

export interface Pattern {
  id: string;
  name: string;
  sticking: Hand[];
}

export interface Measure {
  pattern: Pattern;
  noteValue: NoteValue;
}

export interface MetronomeState {
  isPlaying: boolean;
  bpm: number;
  noteValue: NoteValue;
  timeSignature: TimeSignature;
  currentMeasureIndex: number;
  currentBeatIndex: number;
  repeatCount: number;
  currentRepeat: number;
}

export interface MetronomeCallbacks {
  onBeat: (beatIndex: number, measureIndex: number) => void;
  onMeasureChange: (measureIndex: number) => void;
  onRepeatChange: (repeatNumber: number) => void;
}

export const NOTE_VALUES: { value: NoteValue; label: string; notesPerBeat: number }[] = [
  { value: 'whole', label: 'Whole Notes', notesPerBeat: 0.25 },
  { value: 'half', label: 'Half Notes', notesPerBeat: 0.5 },
  { value: 'quarter', label: 'Quarter Notes', notesPerBeat: 1 },
  { value: 'eighth', label: 'Eighth Notes', notesPerBeat: 2 },
  { value: 'sixteenth', label: 'Sixteenth Notes', notesPerBeat: 4 },
  { value: 'eighth-triplet', label: 'Eighth Triplets', notesPerBeat: 3 },
  { value: 'sixteenth-triplet', label: 'Sixteenth Triplets', notesPerBeat: 6 },
];

export function getNotesPerBeat(noteValue: NoteValue): number {
  const note = NOTE_VALUES.find(n => n.value === noteValue);
  return note?.notesPerBeat ?? 1;
}

export function getNotesPerMeasure(noteValue: NoteValue, beatsPerMeasure: number = 4): number {
  return Math.floor(getNotesPerBeat(noteValue) * beatsPerMeasure);
}

export function getCompatibleNoteValues(timeSignature: TimeSignature): NoteValue[] {
  const config = TIME_SIGNATURE_CONFIGS[timeSignature];

  if (config.isCompound) {
    // For compound time (6/8), triplet-based divisions are natural
    // but we also allow regular subdivisions
    return ['quarter', 'eighth', 'sixteenth', 'eighth-triplet', 'sixteenth-triplet'];
  }

  // For simple time signatures
  return ['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'eighth-triplet', 'sixteenth-triplet'];
}

export function getNotesPerMeasureForTimeSignature(noteValue: NoteValue, timeSignature: TimeSignature): number {
  const config = TIME_SIGNATURE_CONFIGS[timeSignature];
  return getNotesPerMeasure(noteValue, config.beatsPerMeasure);
}
