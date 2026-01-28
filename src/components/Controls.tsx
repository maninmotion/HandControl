import React from 'react';
import { NoteValue, TimeSignature, ClickMode, NOTE_VALUES } from '../types';
import { PatternMode } from '../data/patterns';
import './Controls.css';

interface ControlsProps {
  isPlaying: boolean;
  bpm: number;
  noteValue: NoteValue;
  timeSignature: TimeSignature;
  repeatCount: number;
  patternMode: PatternMode;
  volume: number;
  clickMode: ClickMode;
  currentPatternIndex: number;
  totalPatterns: number;
  compatibleNoteValues: NoteValue[];
  onTogglePlay: () => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
  onNoteValueChange: (noteValue: NoteValue) => void;
  onTimeSignatureChange: (timeSignature: TimeSignature) => void;
  onRepeatCountChange: (count: number) => void;
  onPatternModeChange: (mode: PatternMode) => void;
  onVolumeChange: (volume: number) => void;
  onClickModeChange: (mode: ClickMode) => void;
  onPatternIndexChange: (index: number) => void;
  onReset: () => void;
}

const TIME_SIGNATURES: TimeSignature[] = ['4/4', '3/4', '2/4', '6/8'];

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  bpm,
  noteValue,
  timeSignature,
  repeatCount,
  patternMode,
  volume,
  clickMode,
  currentPatternIndex,
  totalPatterns,
  compatibleNoteValues,
  onTogglePlay,
  onStop,
  onBpmChange,
  onNoteValueChange,
  onTimeSignatureChange,
  onRepeatCountChange,
  onPatternModeChange,
  onVolumeChange,
  onClickModeChange,
  onPatternIndexChange,
  onReset,
}) => {
  // Filter note values to only show compatible ones
  const availableNoteValues = NOTE_VALUES.filter(
    note => compatibleNoteValues.includes(note.value)
  );

  // Handle time signature change - may need to adjust note value
  const handleTimeSignatureChange = (newTimeSig: TimeSignature) => {
    onTimeSignatureChange(newTimeSig);
    // If current note value isn't compatible, we'll let useMetronome handle the adjustment
  };

  return (
    <div className="controls horizontal">
      {/* Play/Stop Controls */}
      <div className="control-group play-controls">
        <button
          className={`play-button ${isPlaying ? 'playing' : ''}`}
          onClick={onTogglePlay}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="28" height="28">
              <rect x="6" y="4" width="4" height="16" fill="currentColor" />
              <rect x="14" y="4" width="4" height="16" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="28" height="28">
              <polygon points="5,3 19,12 5,21" fill="currentColor" />
            </svg>
          )}
        </button>
        <button className="stop-button" onClick={onStop} disabled={!isPlaying}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <rect x="4" y="4" width="16" height="16" fill="currentColor" />
          </svg>
        </button>
        <button className="reset-button" onClick={onReset}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      {/* Time Signature */}
      <div className="control-group">
        <label className="control-label">Time</label>
        <div className="time-sig-buttons">
          {TIME_SIGNATURES.map((sig) => (
            <button
              key={sig}
              className={`time-sig-button ${timeSignature === sig ? 'active' : ''}`}
              onClick={() => handleTimeSignatureChange(sig)}
            >
              {sig}
            </button>
          ))}
        </div>
      </div>

      {/* BPM Control */}
      <div className="control-group bpm-group">
        <label className="control-label">
          BPM <span className="value">{bpm}</span>
        </label>
        <div className="slider-row">
          <button className="adjust-btn" onClick={() => onBpmChange(bpm - 5)}>-5</button>
          <input
            type="range"
            min="20"
            max="300"
            value={bpm}
            onChange={(e) => onBpmChange(parseInt(e.target.value))}
            className="slider"
          />
          <button className="adjust-btn" onClick={() => onBpmChange(bpm + 5)}>+5</button>
        </div>
      </div>

      {/* Note Value Selection */}
      <div className="control-group">
        <label className="control-label">Note Value</label>
        <select
          value={noteValue}
          onChange={(e) => onNoteValueChange(e.target.value as NoteValue)}
          className="select"
        >
          {availableNoteValues.map((note) => (
            <option key={note.value} value={note.value}>
              {note.label}
            </option>
          ))}
        </select>
      </div>

      {/* Volume Control */}
      <div className="control-group volume-group">
        <label className="control-label">
          Vol <span className="value">{Math.round(volume * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={volume * 100}
          onChange={(e) => onVolumeChange(parseInt(e.target.value) / 100)}
          className="slider"
        />
      </div>

      {/* Click Mode */}
      <div className="control-group">
        <label className="control-label">Click</label>
        <div className="mode-toggle">
          <button
            className={`mode-button ${clickMode === 'every-note' ? 'active' : ''}`}
            onClick={() => onClickModeChange('every-note')}
            title="Click on every note"
          >
            All
          </button>
          <button
            className={`mode-button ${clickMode === 'quarter-only' ? 'active' : ''}`}
            onClick={() => onClickModeChange('quarter-only')}
            title="Click on quarter notes only"
          >
            1/4
          </button>
        </div>
      </div>

      {/* Repeat Count */}
      <div className="control-group">
        <label className="control-label">
          Repeats <span className="value">{repeatCount}x</span>
        </label>
        <div className="slider-row">
          <button
            className="adjust-btn"
            onClick={() => onRepeatCountChange(repeatCount - 1)}
            disabled={repeatCount <= 1}
          >
            -
          </button>
          <input
            type="range"
            min="1"
            max="32"
            value={repeatCount}
            onChange={(e) => onRepeatCountChange(parseInt(e.target.value))}
            className="slider"
          />
          <button
            className="adjust-btn"
            onClick={() => onRepeatCountChange(repeatCount + 1)}
            disabled={repeatCount >= 32}
          >
            +
          </button>
        </div>
      </div>

      {/* Pattern Mode */}
      <div className="control-group">
        <label className="control-label">Mode</label>
        <div className="mode-toggle">
          <button
            className={`mode-button ${patternMode === 'sequential' ? 'active' : ''}`}
            onClick={() => onPatternModeChange('sequential')}
          >
            Seq
          </button>
          <button
            className={`mode-button ${patternMode === 'random' ? 'active' : ''}`}
            onClick={() => onPatternModeChange('random')}
          >
            Rand
          </button>
        </div>
      </div>

      {/* Pattern Index Slider */}
      <div className="control-group pattern-group">
        <label className="control-label">
          Pattern <span className="value">{currentPatternIndex + 1} / {totalPatterns}</span>
        </label>
        <input
          type="range"
          min="0"
          max={totalPatterns - 1}
          value={currentPatternIndex}
          onChange={(e) => onPatternIndexChange(parseInt(e.target.value))}
          className="slider"
          disabled={isPlaying}
        />
      </div>
    </div>
  );
};
