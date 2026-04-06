// src/lib/stores/game.ts
import { writable } from 'svelte/store';

export type GameState = 'config' | 'idle' | 'active' | 'results';
export type Language = 'python' | 'javascript' | 'typescript' | 'go' | 'rust' | 'c' | 'cpp';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'any';

export const gameState = writable<GameState>('config');
export const selectedLanguage = writable<Language>('python');
export const selectedDifficulty = writable<Difficulty>('any');

export const currentSnippet = writable<Snippet | null>(null);
export const typedCharacters = writable<CharState[]>([]);

export interface Snippet {
  id: string;
  lang: Language;
  repo: string;
  file: string;
  difficulty: Difficulty;
  length: number;
  chars: string;
  attribution_url: string;
}

export interface CharState {
  char: string;
  state: 'pending' | 'correct' | 'incorrect';
  errors: number;
}
