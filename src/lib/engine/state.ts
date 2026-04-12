// src/lib/engine/state.ts
import type { CharState } from '../stores/game';

export interface TypingEngine {
  originalText: string;
  language: string;
  chars: string;
  currentIndex: number;
  charStates: CharState[];
  startTime: number | null;
  keystrokeTimes: number[];
  totalErrors: number;
  isComplete: boolean;
}

export function initTypingState(chars: string, language: string = 'python'): TypingEngine {
  return {
    originalText: chars,
    language,
    chars,
    currentIndex: 0,
    charStates: chars.split('').map((c) => ({
      char: c,
      state: 'pending' as const,
      errors: 0,
    })),
    startTime: null,
    keystrokeTimes: [],
    totalErrors: 0,
    isComplete: false,
  };
}

export function processKeystroke(engine: TypingEngine, key: string): TypingEngine {
  const now = performance.now();
  
  if (key === 'Backspace') {
    if (engine.currentIndex > 0) {
      const newIndex = engine.currentIndex - 1;
      const newStates = engine.charStates.map((s, i) => 
        i === newIndex ? { ...s, state: 'pending' as const } : s
      );
      return { ...engine, currentIndex: newIndex, charStates: newStates };
    }
    return engine;
  }

  const startTime = engine.startTime ?? now;
  const keystrokeTimes = [...engine.keystrokeTimes, now];
  
  if (engine.currentIndex >= engine.chars.length) {
    return engine;
  }

  const expectedChar = engine.chars[engine.currentIndex];
  const isCorrect = key === expectedChar;
  
  const newStates = engine.charStates.map((s, i) => {
    if (i === engine.currentIndex) {
      return {
        ...s,
        state: isCorrect ? 'correct' as const : 'incorrect' as const,
        errors: isCorrect ? s.errors : s.errors + 1,
      };
    }
    return s;
  });

  const newIndex = engine.currentIndex + 1;
  const isComplete = newIndex >= engine.chars.length;

  return {
    ...engine,
    currentIndex: newIndex,
    charStates: newStates,
    startTime,
    keystrokeTimes,
    totalErrors: isCorrect ? engine.totalErrors : engine.totalErrors + 1,
    isComplete,
  };
}
