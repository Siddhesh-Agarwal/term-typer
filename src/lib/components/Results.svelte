<!-- src/lib/components/Results.svelte -->
<script lang="ts">
  import { gameState, currentSnippet } from '../stores/game';
  import type { Metrics } from '../engine/metrics';
  import { Download } from 'lucide-svelte';
  
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

  function downloadResult() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('termtyper', 400, 60);
    
    ctx.fillStyle = '#8b949e';
    ctx.font = '20px monospace';
    ctx.fillText('Results', 400, 100);

    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 130, 700, 400);

    const metricsData = [
      { label: 'Net TPM', value: metrics.netTpm.toString(), color: '#3fb950' },
      { label: 'Gross TPM', value: metrics.grossTpm.toString(), color: '#58a6ff' },
      { label: 'Accuracy', value: `${metrics.accuracy}%`, color: '#f85149' },
    ];

    metricsData.forEach((m, i) => {
      const x = 150 + i * 200;
      const y = 220;
      
      ctx.fillStyle = m.color;
      ctx.font = 'bold 56px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m.value, x, y);
      
      ctx.fillStyle = '#8b949e';
      ctx.font = '18px monospace';
      ctx.fillText(m.label, x, y + 40);
    });

    const secondaryData = [
      { label: 'Consistency', value: `${metrics.consistency}%` },
      { label: 'Time', value: `${Math.floor(elapsedMs / 60000)}:${(Math.floor(elapsedMs / 1000) % 60).toString().padStart(2, '0')}` },
    ];

    secondaryData.forEach((s, i) => {
      const x = 250 + i * 300;
      const y = 360;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.value, x, y);
      
      ctx.fillStyle = '#8b949e';
      ctx.font = '16px monospace';
      ctx.fillText(s.label, x, y + 30);
    });

    if ($currentSnippet) {
      ctx.fillStyle = '#8b949e';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`From: ${$currentSnippet.repo} | ${$currentSnippet.file}`, 400, 480);
      ctx.fillText(`Language: ${$currentSnippet.lang} | Difficulty: ${$currentSnippet.difficulty}`, 400, 500);
    }

    const link = document.createElement('a');
    link.download = `termtyper-result-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
</script>

<div class="fixed inset-0 bg-bg/95 flex items-center justify-center p-8">
  <div class="max-w-2xl w-full bg-surface rounded-xl p-8 border border-border">
    <h2 class="text-3xl font-bold mb-6 text-accent">Results</h2>
    
    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="text-center p-4 bg-bg rounded-lg">
        <div class="text-4xl font-bold text-correct">{metrics.netTpm}</div>
        <div class="text-sm text-gray-500">Net TPM</div>
      </div>
      <div class="text-center p-4 bg-bg rounded-lg">
        <div class="text-4xl font-bold">{metrics.grossTpm}</div>
        <div class="text-sm text-gray-500">Gross TPM</div>
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
      <button class="flex-1 py-3 border border-border rounded-lg hover:border-accent flex items-center justify-center gap-2" on:click={downloadResult}>
        <Download size={18} />
        Download
      </button>
      <button class="py-3 px-6 border border-border rounded-lg" on:click={backToConfig}>
        Config
      </button>
    </div>
  </div>
</div>