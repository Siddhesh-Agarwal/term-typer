<!-- src/App.svelte -->
<script lang="ts">
  import { gameState, currentSnippet } from './lib/stores/game';
  import Config from './lib/components/Config.svelte';
  import TypingArea from './lib/components/TypingArea.svelte';
  import Results from './lib/components/Results.svelte';
  import { typedCharacters } from './lib/stores/game';
  import { calculateMetrics } from './lib/engine/metrics';
  import { initTypingState } from './lib/engine/state';
  import { onMount } from 'svelte';

  let metrics = { grossWpm: 0, netWpm: 0, accuracy: 100, elapsedMs: 0, consistency: 0, timeToFirstError: null };
  let elapsedMs = 0;
  let finalMetricsCalculated = false;

  $: if ($gameState === 'results' && $currentSnippet && !finalMetricsCalculated) {
    const engine = initTypingState($currentSnippet.chars);
    const charStates = $typedCharacters;
    let totalErrors = 0;
    for (const char of charStates) {
      if (char.errors > 0) totalErrors += char.errors;
    }
    const finalEngine = {
      ...engine,
      currentIndex: $currentSnippet.length,
      charStates,
      totalErrors,
      isComplete: true,
    };
    metrics = calculateMetrics(finalEngine, elapsedMs);
    finalMetricsCalculated = true;
  }

  $: if ($gameState === 'config') {
    finalMetricsCalculated = false;
    elapsedMs = 0;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && ($gameState === 'idle' || $gameState === 'active')) {
      gameState.set('config');
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<main class="min-h-screen bg-bg">
  {#if $gameState === 'config'}
    <Config />
  {:else if $gameState === 'idle' || $gameState === 'active'}
    <TypingArea bind:elapsedMs />
  {:else if $gameState === 'results'}
    <Results {metrics} {elapsedMs} />
  {/if}
</main>