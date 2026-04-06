// src/lib/engine/metrics.ts
import type { TypingEngine } from './state';

export interface Metrics {
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  elapsedMs: number;
  consistency: number;
  timeToFirstError: number | null;
}

export function calculateMetrics(engine: TypingEngine, elapsedMs: number): Metrics {
  const minutes = elapsedMs / 60000;
  const charsTyped = engine.currentIndex;
  const grossWpm = minutes > 0 ? charsTyped / 5 / minutes : 0;
  const netWpm = grossWpm - (engine.totalErrors / minutes || 0);
  
  const accuracy = charsTyped > 0 
    ? ((charsTyped - engine.totalErrors) / charsTyped) * 100 
    : 100;

  let consistency = 0;
  if (engine.keystrokeTimes.length > 2) {
    const intervals: number[] = [];
    for (let i = 1; i < engine.keystrokeTimes.length; i++) {
      intervals.push(engine.keystrokeTimes[i] - engine.keystrokeTimes[i - 1]);
    }
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    consistency = mean > 0 ? Math.max(0, (1 - stdDev / mean) * 100) : 100;
  }

  const firstErrorIdx = engine.charStates.findIndex(s => s.errors > 0);
  const timeToFirstError = firstErrorIdx >= 0 && engine.keystrokeTimes[firstErrorIdx] 
    ? engine.keystrokeTimes[firstErrorIdx] 
    : null;

  return {
    grossWpm: Math.round(grossWpm),
    netWpm: Math.round(Math.max(0, netWpm)),
    accuracy: Math.round(accuracy * 10) / 10,
    elapsedMs,
    consistency: Math.round(consistency),
    timeToFirstError,
  };
}
