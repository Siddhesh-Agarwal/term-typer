// src/lib/engine/metrics.ts
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import type { TypingEngine } from './state';
import type { Language } from '../stores/game';

export interface Metrics {
  grossTpm: number;
  netTpm: number;
  accuracy: number;
  elapsedMs: number;
  consistency: number;
  timeToFirstError: number | null;
}

const languageMap: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  go: 'go',
  rust: 'rust',
  c: 'c',
  cpp: 'cpp',
};

function countTokens(code: string, lang: Language): number {
  const prismLang = languageMap[lang] || 'javascript';
  const tokens = Prism.tokenize(code, Prism.languages[prismLang]);
  
  let count = 0;
  function traverse(token: any): void {
    if (typeof token === 'string') {
      if (token.trim().length > 0) count++;
    } else if (token.type && token.content) {
      if (typeof token.content === 'string') {
        if (token.content.trim().length > 0) count++;
      } else if (Array.isArray(token.content)) {
        token.content.forEach(traverse);
      }
    }
  }
  
  tokens.forEach(traverse);
  return count;
}

function countTokensTyped(code: string, currentIndex: number, lang: Language): number {
  const prefix = code.substring(0, currentIndex);
  return countTokens(prefix, lang);
}

export function calculateMetrics(engine: TypingEngine, elapsedMs: number, lang: Language): Metrics {
  const minutes = elapsedMs / 60000;
  const tokensTyped = countTokensTyped(engine.originalText, engine.currentIndex, lang);
  const totalTokens = countTokens(engine.originalText, lang);
  
  const grossTpm = minutes > 0 ? tokensTyped / minutes : 0;
  const netTpm = grossTpm - (engine.totalErrors / minutes || 0);
  
  const charsTyped = engine.currentIndex;
  const accuracy = charsTyped > 0 
    ? ((charsTyped - engine.totalErrors) / charsTyped) * 100 
    : 100;

  let consistency = 0;
  if (engine.keystrokeTimes.length >= 2) {
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
    grossTpm: Math.round(grossTpm),
    netTpm: Math.round(Math.max(0, netTpm)),
    accuracy: Math.round(accuracy * 10) / 10,
    elapsedMs,
    consistency: Math.round(consistency),
    timeToFirstError,
  };
}
