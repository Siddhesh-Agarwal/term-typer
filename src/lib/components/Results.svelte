<!-- src/lib/components/Results.svelte -->
<script lang="ts">
  import { gameState, currentSnippet } from '../stores/game';
  import type { Metrics } from '../engine/metrics';
  
  export let metrics: Metrics;
  export let elapsedMs: number;

  function newSnippet() {
    gameState.set('idle');
  }

  function retry() {
    if ($currentSnippet) {
      gameState.set('idle');
    }
  }

  function backToConfig() {
    gameState.set('config');
  }
</script>

<div class="fixed inset-0 bg-bg/95 flex items-center justify-center p-8">
  <div class="max-w-2xl w-full bg-surface rounded-xl p-8 border border-border">
    <h2 class="text-3xl font-bold mb-6 text-accent">Results</h2>
    
    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="text-center p-4 bg-bg rounded-lg">
        <div class="text-4xl font-bold text-correct">{metrics.netWpm}</div>
        <div class="text-sm text-gray-500">Net WPM</div>
      </div>
      <div class="text-center p-4 bg-bg rounded-lg">
        <div class="text-4xl font-bold">{metrics.grossWpm}</div>
        <div class="text-sm text-gray-500">Gross WPM</div>
      </div>
      <div class="text-center p-4 bg-bg rounded-lg">
        <div class="text-4xl font-bold">{metrics.accuracy}%</div>
        <div class="text-sm text-gray-500">Accuracy</div>
      </div>
    </div>
    
    <div class="grid grid-cols-2 gap-4 mb-8">
      <div class="p-4 bg-bg rounded-lg">
        <div class="text-lg font-bold">{metrics.consistency}%</div>
        <div class="text-sm text-gray-500">Consistency</div>
      </div>
      <div class="p-4 bg-bg rounded-lg">
        <div class="text-lg font-bold">
          {Math.floor(elapsedMs / 60000)}:{(Math.floor(elapsedMs / 1000) % 60).toString().padStart(2, '0')}
        </div>
        <div class="text-sm text-gray-500">Time</div>
      </div>
    </div>
    
    {#if $currentSnippet}
      <div class="text-sm text-gray-500 mb-6">
        <p>From: {$currentSnippet.repo}</p>
        <p class="truncate">{$currentSnippet.file}</p>
      </div>
    {/if}
    
    <div class="flex gap-4">
      <button class="flex-1 py-3 bg-accent text-bg font-bold rounded-lg hover:bg-accent/80" on:click={newSnippet}>
        New Snippet
      </button>
      <button class="flex-1 py-3 border border-border rounded-lg hover:border-accent" on:click={retry}>
        Retry This
      </button>
      <button class="py-3 px-6 border border-border rounded-lg" on:click={backToConfig}>
        Config
      </button>
    </div>
  </div>
</div>