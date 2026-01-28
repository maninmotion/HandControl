import React, { useEffect, useCallback } from 'react';
import { useMetronome } from './hooks/useMetronome';
import { TwoMeasureDisplay } from './components/MeasureDisplay';
import { Controls } from './components/Controls';
import './App.css';

const App: React.FC = () => {
  const {
    isPlaying,
    bpm,
    noteValue,
    timeSignature,
    currentBeatIndex,
    repeatCount,
    currentRepeat,
    patternMode,
    currentPatternIndex,
    volume,
    clickMode,
    currentTwoMeasure,
    nextTwoMeasure,
    currentPatternName,
    nextPatternName,
    totalPatterns,
    compatibleNoteValues,
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
  } = useMetronome();

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
      return;
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'Escape':
        stop();
        break;
      case 'ArrowUp':
        e.preventDefault();
        setBpm(bpm + 5);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setBpm(bpm - 5);
        break;
      case 'KeyR':
        if (!e.metaKey && !e.ctrlKey) {
          reset();
        }
        break;
    }
  }, [togglePlay, stop, setBpm, bpm, reset]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="app landscape-layout">
      <header className="app-header compact">
        <h1>Hand Control</h1>
        <span className="pattern-counter">
          Pattern {currentPatternIndex + 1} / {totalPatterns}
        </span>
      </header>

      <main className="app-main">
        <div className="pattern-row">
          {/* Current Pattern Pane */}
          <div className="current-pattern-pane">
            <div className="pane-label">Current</div>
            <TwoMeasureDisplay
              measure1Sticking={currentTwoMeasure.measure1.sticking}
              measure2Sticking={currentTwoMeasure.measure2.sticking}
              currentBeatIndex={currentBeatIndex}
              isActive={true}
              isPlaying={isPlaying}
              patternName={currentPatternName}
              noteValue={noteValue}
              timeSignature={timeSignature}
              repeatInfo={`${currentRepeat} / ${repeatCount}`}
            />
          </div>

          {/* Next Pattern Pane */}
          <div className="next-pattern-pane">
            <div className="pane-label">Next</div>
            <TwoMeasureDisplay
              measure1Sticking={nextTwoMeasure.measure1.sticking}
              measure2Sticking={nextTwoMeasure.measure2.sticking}
              currentBeatIndex={-1}
              isActive={false}
              isPlaying={false}
              patternName={nextPatternName}
              noteValue={noteValue}
              timeSignature={timeSignature}
            />
          </div>
        </div>

        <div className="controls-row">
          <Controls
            isPlaying={isPlaying}
            bpm={bpm}
            noteValue={noteValue}
            timeSignature={timeSignature}
            repeatCount={repeatCount}
            patternMode={patternMode}
            volume={volume}
            clickMode={clickMode}
            currentPatternIndex={currentPatternIndex}
            totalPatterns={totalPatterns}
            compatibleNoteValues={compatibleNoteValues}
            onTogglePlay={togglePlay}
            onBpmChange={setBpm}
            onNoteValueChange={setNoteValue}
            onTimeSignatureChange={setTimeSignature}
            onRepeatCountChange={setRepeatCount}
            onPatternModeChange={setPatternMode}
            onVolumeChange={setVolume}
            onClickModeChange={setClickMode}
            onPatternIndexChange={jumpToPattern}
            onReset={reset}
          />
        </div>
      </main>

      <footer className="app-footer">
        <p>Inspired by "Stick Control" by George Lawrence Stone</p>
      </footer>
    </div>
  );
};

export default App;
