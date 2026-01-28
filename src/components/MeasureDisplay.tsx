import React from 'react';
import { Hand, NoteValue, TimeSignature, TIME_SIGNATURE_CONFIGS } from '../types';
import './MeasureDisplay.css';

interface TwoMeasureDisplayProps {
  measure1Sticking: Hand[];
  measure2Sticking: Hand[];
  currentBeatIndex: number;
  isActive: boolean;
  isPlaying: boolean;
  patternName: string;
  noteValue: NoteValue;
  timeSignature: TimeSignature;
  repeatInfo?: string;
}

// SVG dimensions and constants
const SVG_WIDTH = 900;
const SVG_HEIGHT = 140;
const STAFF_TOP = 30;
const STAFF_LINE_SPACING = 10;
const STAFF_HEIGHT = STAFF_LINE_SPACING * 4;
const LEFT_MARGIN = 50;
const RIGHT_MARGIN = 15;
const NOTE_AREA_WIDTH = SVG_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;
const SNARE_LINE_Y = STAFF_TOP + STAFF_LINE_SPACING * 2;
const HAND_LABEL_Y = STAFF_TOP + STAFF_HEIGHT + 30;

// Note visual constants
const NOTE_HEAD_RX = 5;
const NOTE_HEAD_RY = 4;
const STEM_HEIGHT = 28;
const FLAG_WIDTH = 7;
const BEAM_HEIGHT = 3;

interface NoteGroupProps {
  notes: { hand: Hand; index: number; x: number }[];
  noteValue: NoteValue;
  currentBeatIndex: number;
  isActive: boolean;
  isPlaying: boolean;
  notesPerMeasure: number;
}

const NoteHead: React.FC<{
  x: number;
  y: number;
  filled: boolean;
  isCurrent: boolean;
}> = ({ x, y, filled, isCurrent }) => (
  <ellipse
    cx={x}
    cy={y}
    rx={NOTE_HEAD_RX}
    ry={NOTE_HEAD_RY}
    className={`note-head ${filled ? 'filled' : 'hollow'} ${isCurrent ? 'current' : ''}`}
    transform={`rotate(-15, ${x}, ${y})`}
  />
);

const Stem: React.FC<{
  x: number;
  noteY: number;
  direction: 'up' | 'down';
  isCurrent: boolean;
}> = ({ x, noteY, direction, isCurrent }) => {
  const stemX = direction === 'up' ? x + NOTE_HEAD_RX - 1 : x - NOTE_HEAD_RX + 1;
  const stemY1 = noteY;
  const stemY2 = direction === 'up' ? noteY - STEM_HEIGHT : noteY + STEM_HEIGHT;

  return (
    <line
      x1={stemX}
      y1={stemY1}
      x2={stemX}
      y2={stemY2}
      className={`stem ${isCurrent ? 'current' : ''}`}
    />
  );
};

const Flag: React.FC<{
  x: number;
  noteY: number;
  direction: 'up' | 'down';
  count: number;
  isCurrent: boolean;
}> = ({ x, noteY, direction, count, isCurrent }) => {
  const flags = [];
  const stemX = direction === 'up' ? x + NOTE_HEAD_RX - 1 : x - NOTE_HEAD_RX + 1;
  const stemEndY = direction === 'up' ? noteY - STEM_HEIGHT : noteY + STEM_HEIGHT;

  for (let i = 0; i < count; i++) {
    const flagY = direction === 'up'
      ? stemEndY + (i * 8)
      : stemEndY - (i * 8);
    const flagPath = direction === 'up'
      ? `M ${stemX} ${flagY} Q ${stemX + FLAG_WIDTH} ${flagY + 8} ${stemX + FLAG_WIDTH - 2} ${flagY + 16}`
      : `M ${stemX} ${flagY} Q ${stemX - FLAG_WIDTH} ${flagY - 8} ${stemX - FLAG_WIDTH + 2} ${flagY - 16}`;

    flags.push(
      <path
        key={i}
        d={flagPath}
        className={`flag ${isCurrent ? 'current' : ''}`}
      />
    );
  }

  return <>{flags}</>;
};

const Beam: React.FC<{
  x1: number;
  x2: number;
  y: number;
  level: number;
  direction: 'up' | 'down';
  isCurrent: boolean;
}> = ({ x1, x2, y, level, direction, isCurrent }) => {
  const beamY = direction === 'up'
    ? y + (level * (BEAM_HEIGHT + 3))
    : y - (level * (BEAM_HEIGHT + 3));

  return (
    <rect
      x={x1}
      y={direction === 'up' ? beamY : beamY - BEAM_HEIGHT}
      width={x2 - x1}
      height={BEAM_HEIGHT}
      className={`beam ${isCurrent ? 'current' : ''}`}
    />
  );
};

const TripletBracket: React.FC<{
  x1: number;
  x2: number;
  y: number;
}> = ({ x1, x2, y }) => {
  const midX = (x1 + x2) / 2;
  const bracketY = y - 8;

  return (
    <g className="triplet-bracket">
      <line x1={x1} y1={bracketY} x2={x1} y2={bracketY - 5} />
      <line x1={x1} y1={bracketY - 5} x2={midX - 8} y2={bracketY - 5} />
      <text x={midX} y={bracketY - 2} textAnchor="middle" className="triplet-number">3</text>
      <line x1={midX + 8} y1={bracketY - 5} x2={x2} y2={bracketY - 5} />
      <line x1={x2} y1={bracketY - 5} x2={x2} y2={bracketY} />
    </g>
  );
};

const TimeSignatureDisplay: React.FC<{
  timeSignature: TimeSignature;
  x: number;
}> = ({ timeSignature, x }) => {
  const config = TIME_SIGNATURE_CONFIGS[timeSignature];
  const topNumber = config.beatsPerMeasure.toString();
  const bottomNumber = config.beatUnit.toString();

  return (
    <g className="time-signature">
      <text x={x} y={STAFF_TOP + STAFF_LINE_SPACING * 1.5} textAnchor="middle">
        {topNumber}
      </text>
      <text x={x} y={STAFF_TOP + STAFF_LINE_SPACING * 3.5} textAnchor="middle">
        {bottomNumber}
      </text>
    </g>
  );
};

const TwoMeasureStaff: React.FC<{ middleBarX: number }> = ({ middleBarX }) => {
  const lines = [];
  for (let i = 0; i < 5; i++) {
    lines.push(
      <line
        key={i}
        x1={LEFT_MARGIN - 15}
        y1={STAFF_TOP + i * STAFF_LINE_SPACING}
        x2={SVG_WIDTH - RIGHT_MARGIN + 5}
        y2={STAFF_TOP + i * STAFF_LINE_SPACING}
        className="staff-line"
      />
    );
  }

  return (
    <g className="staff">
      {lines}
      {/* Left bar line */}
      <line
        x1={LEFT_MARGIN - 15}
        y1={STAFF_TOP}
        x2={LEFT_MARGIN - 15}
        y2={STAFF_TOP + STAFF_HEIGHT}
        className="bar-line"
      />
      {/* Middle bar line (between measure 1 and 2) */}
      <line
        x1={middleBarX}
        y1={STAFF_TOP}
        x2={middleBarX}
        y2={STAFF_TOP + STAFF_HEIGHT}
        className="bar-line middle"
      />
      {/* Right bar line (double bar) */}
      <line
        x1={SVG_WIDTH - RIGHT_MARGIN + 2}
        y1={STAFF_TOP}
        x2={SVG_WIDTH - RIGHT_MARGIN + 2}
        y2={STAFF_TOP + STAFF_HEIGHT}
        className="bar-line"
      />
      <line
        x1={SVG_WIDTH - RIGHT_MARGIN + 6}
        y1={STAFF_TOP}
        x2={SVG_WIDTH - RIGHT_MARGIN + 6}
        y2={STAFF_TOP + STAFF_HEIGHT}
        className="bar-line thick"
      />
    </g>
  );
};

function getBeamGroupSize(noteValue: NoteValue): number {
  switch (noteValue) {
    case 'eighth':
      return 2;
    case 'sixteenth':
      return 4;
    case 'eighth-triplet':
      return 3;
    case 'sixteenth-triplet':
      return 6;
    default:
      return 1;
  }
}

function getFlagCount(noteValue: NoteValue): number {
  switch (noteValue) {
    case 'eighth':
    case 'eighth-triplet':
      return 1;
    case 'sixteenth':
    case 'sixteenth-triplet':
      return 2;
    default:
      return 0;
  }
}

function isFilledNote(noteValue: NoteValue): boolean {
  return !['whole', 'half'].includes(noteValue);
}

function hasStem(noteValue: NoteValue): boolean {
  return noteValue !== 'whole';
}

const NoteGroup: React.FC<NoteGroupProps> = ({
  notes,
  noteValue,
  currentBeatIndex,
  isActive,
  isPlaying,
  notesPerMeasure,
}) => {
  const filled = isFilledNote(noteValue);
  const showStem = hasStem(noteValue);
  const flagCount = getFlagCount(noteValue);
  const groupSize = getBeamGroupSize(noteValue);
  const isTriplet = noteValue.includes('triplet');
  const direction = 'up';

  // Group notes for beaming - but don't group across measure boundary
  const groups: { hand: Hand; index: number; x: number }[][] = [];

  // Split notes by measure first
  const measure1Notes = notes.filter(n => n.index < notesPerMeasure);
  const measure2Notes = notes.filter(n => n.index >= notesPerMeasure);

  // Group within each measure
  for (let i = 0; i < measure1Notes.length; i += groupSize) {
    groups.push(measure1Notes.slice(i, i + groupSize));
  }
  for (let i = 0; i < measure2Notes.length; i += groupSize) {
    groups.push(measure2Notes.slice(i, i + groupSize));
  }

  return (
    <g className="note-group">
      {groups.map((group, groupIndex) => {
        const useBeams = group.length > 1 && flagCount > 0;
        const groupHasCurrent = isActive && isPlaying &&
          group.some(n => n.index === currentBeatIndex);

        return (
          <g key={groupIndex} className="beam-group">
            {/* Triplet bracket */}
            {isTriplet && group.length >= 3 && (
              <TripletBracket
                x1={group[0].x}
                x2={group[group.length - 1].x}
                y={SNARE_LINE_Y - STEM_HEIGHT}
              />
            )}

            {/* Beams */}
            {useBeams && (
              <>
                <Beam
                  x1={group[0].x + NOTE_HEAD_RX - 1}
                  x2={group[group.length - 1].x + NOTE_HEAD_RX - 1}
                  y={SNARE_LINE_Y - STEM_HEIGHT}
                  level={0}
                  direction={direction}
                  isCurrent={groupHasCurrent}
                />
                {flagCount >= 2 && (
                  <Beam
                    x1={group[0].x + NOTE_HEAD_RX - 1}
                    x2={group[group.length - 1].x + NOTE_HEAD_RX - 1}
                    y={SNARE_LINE_Y - STEM_HEIGHT}
                    level={1}
                    direction={direction}
                    isCurrent={groupHasCurrent}
                  />
                )}
              </>
            )}

            {/* Individual notes */}
            {group.map((note) => {
              const isCurrent = isActive && isPlaying && note.index === currentBeatIndex;
              const isPast = isActive && isPlaying && note.index < currentBeatIndex;

              return (
                <g key={note.index} className={`note ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}`}>
                  <NoteHead
                    x={note.x}
                    y={SNARE_LINE_Y}
                    filled={filled}
                    isCurrent={isCurrent}
                  />

                  {showStem && (
                    <Stem
                      x={note.x}
                      noteY={SNARE_LINE_Y}
                      direction={direction}
                      isCurrent={isCurrent}
                    />
                  )}

                  {!useBeams && flagCount > 0 && (
                    <Flag
                      x={note.x}
                      noteY={SNARE_LINE_Y}
                      direction={direction}
                      count={flagCount}
                      isCurrent={isCurrent}
                    />
                  )}

                  {isCurrent && (
                    <circle
                      cx={note.x}
                      cy={SNARE_LINE_Y}
                      r={12}
                      className="beat-pulse"
                    />
                  )}

                  <text
                    x={note.x}
                    y={HAND_LABEL_Y}
                    textAnchor="middle"
                    className={`hand-label ${note.hand.toLowerCase()} ${isCurrent ? 'current' : ''}`}
                  >
                    {note.hand}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

export const TwoMeasureDisplay: React.FC<TwoMeasureDisplayProps> = ({
  measure1Sticking,
  measure2Sticking,
  currentBeatIndex,
  isActive,
  isPlaying,
  patternName,
  noteValue,
  timeSignature,
  repeatInfo,
}) => {
  const notesPerMeasure = measure1Sticking.length;

  // Calculate layout
  const measureWidth = (NOTE_AREA_WIDTH - 20) / 2; // Leave space for middle bar
  const middleBarX = LEFT_MARGIN + measureWidth + 10;

  // Calculate note positions for both measures
  const measure1Spacing = measureWidth / (notesPerMeasure + 1);
  const measure2Spacing = measureWidth / (notesPerMeasure + 1);

  const allNotes = [
    ...measure1Sticking.map((hand, index) => ({
      hand,
      index,
      x: LEFT_MARGIN + measure1Spacing * (index + 1),
    })),
    ...measure2Sticking.map((hand, index) => ({
      hand,
      index: index + notesPerMeasure,
      x: middleBarX + 10 + measure2Spacing * (index + 1),
    })),
  ];

  return (
    <div className={`measure-display two-measure ${isActive ? 'active' : 'preview'}`}>
      <div className="measure-header">
        <div className="measure-info">
          <span className="pattern-name">{patternName}</span>
          <span className="measure-label">Pattern + Reversal</span>
        </div>
        {repeatInfo && <span className="repeat-info">{repeatInfo}</span>}
      </div>

      <svg
        className="staff-svg"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <TwoMeasureStaff middleBarX={middleBarX} />
        <TimeSignatureDisplay timeSignature={timeSignature} x={LEFT_MARGIN - 2} />
        <NoteGroup
          notes={allNotes}
          noteValue={noteValue}
          currentBeatIndex={currentBeatIndex}
          isActive={isActive}
          isPlaying={isPlaying}
          notesPerMeasure={notesPerMeasure}
        />
      </svg>
    </div>
  );
};

// Keep the old component for backwards compatibility if needed
export const MeasureDisplay = TwoMeasureDisplay;
