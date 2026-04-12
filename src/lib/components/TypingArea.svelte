<!-- src/lib/components/TypingArea.svelte -->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { gameState, currentSnippet, typedCharacters, selectedLanguage, selectedDifficulty } from '../stores/game';
  import { initTypingState, processKeystroke, type TypingEngine } from '../engine/state';
  import { calculateMetrics, type Metrics } from '../engine/metrics';
  import Character from './Character.svelte';
  import type { Snippet } from '../stores/game';
  import snippetsData from '../data/snippets.json';
  const snippets = snippetsData as Snippet[];

  let engine: TypingEngine | null = null;
  let metrics: Metrics = { grossTpm: 0, netTpm: 0, accuracy: 100, elapsedMs: 0, consistency: 0, timeToFirstError: null };
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let startTime = 0;
  export let elapsedMs = 0;

  $: if ($gameState === 'idle' && $selectedLanguage && $selectedDifficulty) {
    const filtered = snippets.filter(
      (s) => s.lang === $selectedLanguage && 
      ($selectedDifficulty === 'any' || s.difficulty === $selectedDifficulty)
    );
    if (filtered.length > 0) {
      const random = filtered[Math.floor(Math.random() * filtered.length)];
      currentSnippet.set(random);
      engine = initTypingState(random.chars, random.lang);
      typedCharacters.set(engine.charStates);
      metrics = { grossTpm: 0, netTpm: 0, accuracy: 100, elapsedMs: 0, consistency: 0, timeToFirstError: null };
      gameState.set('active');
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if ($gameState !== 'active' || !engine || !$currentSnippet) return;
    if (e.key === 'Escape') {
      gameState.set('config');
      return;
    }
    if (e.ctrlKey || e.metaKey) return;
    
    e.preventDefault();
    
    if (e.key === 'Tab') {
      engine = processKeystroke(engine, '\t');
    } else if (e.key === 'Enter') {
      engine = processKeystroke(engine, '\n');
    } else if (e.key === 'Backspace') {
      engine = processKeystroke(engine, 'Backspace');
    } else if (e.key.length === 1) {
      engine = processKeystroke(engine, e.key);
    }
    
    typedCharacters.set(engine.charStates);
    
    if (engine.startTime && !timerInterval) {
      startTime = engine.startTime;
      timerInterval = setInterval(() => {
        elapsedMs = performance.now() - startTime;
        metrics = calculateMetrics(engine!, elapsedMs, $selectedLanguage);
      }, 500);
    }
    
    if (engine.isComplete) {
      if (timerInterval) clearInterval(timerInterval);
      elapsedMs = performance.now() - startTime;
      metrics = calculateMetrics(engine, elapsedMs, $selectedLanguage);
      gameState.set('results');
    }
  }

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="max-w-4xl mx-auto p-8">
  {#if $currentSnippet}
    <div class="flex gap-2 mb-4">
      <span class="px-3 py-1 bg-surface rounded text-sm text-gray-400">{$currentSnippet.lang}</span>
      <span class="px-3 py-1 bg-surface rounded text-sm text-gray-400">{$currentSnippet.difficulty}</span>
      <button class="px-3 py-1 bg-surface rounded text-sm text-accent hover:underline" on:click={() => gameState.set('config')}>
        Change
      </button>
    </div>
    
    <div class="bg-surface rounded-lg p-6 font-mono text-lg leading-relaxed border border-border">
      {#each $typedCharacters as char, i}
        <Character {char} isCursor={i === engine?.currentIndex} />
      {/each}
    </div>
    
    <div class="flex justify-between mt-4 text-gray-400">
      <span>TPM: {metrics.netTpm}</span>
      <span>Accuracy: {metrics.accuracy}%</span>
      <span>{Math.floor(elapsedMs / 60000)}:{(Math.floor(elapsedMs / 1000) % 60).toString().padStart(2, '0')}</span>
    </div>
  {:else}
    <p class="text-center text-gray-500">Loading snippet...</p>
  {/if}
</div>
