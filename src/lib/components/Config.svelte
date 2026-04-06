<!-- src/lib/components/Config.svelte -->
<script lang="ts">
  import { selectedLanguage, selectedDifficulty, gameState, type Language, type Difficulty } from '../stores/game';

  const languages: { id: Language; label: string }[] = [
    { id: 'python', label: 'Python' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'go', label: 'Go' },
    { id: 'rust', label: 'Rust' },
    { id: 'c', label: 'C' },
    { id: 'cpp', label: 'C++' },
  ];

  const difficulties: { id: Difficulty; label: string }[] = [
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
    { id: 'any', label: 'Any' },
  ];

  function startTest() {
    if ($selectedLanguage && $selectedDifficulty) {
      gameState.set('idle');
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      startTest();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="flex flex-col items-center justify-center min-h-screen p-8">
  <h1 class="text-4xl font-bold mb-2 text-accent">termtyper</h1>
  <p class="text-gray-500 mb-12">Suffering with purpose.</p>

  <div class="mb-8">
    <h2 class="text-sm uppercase tracking-wider text-gray-500 mb-4">Language</h2>
    <div class="flex flex-wrap gap-3 justify-center">
      {#each languages as lang}
        <button
          class="px-6 py-3 rounded-lg border transition-all {$selectedLanguage === lang.id 
            ? 'border-accent bg-accent/10 text-accent' 
            : 'border-border hover:border-gray-500'}"
          on:click={() => selectedLanguage.set(lang.id)}
        >
          {lang.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="mb-12">
    <h2 class="text-sm uppercase tracking-wider text-gray-500 mb-4">Difficulty</h2>
    <div class="flex gap-3 justify-center">
      {#each difficulties as diff}
        <button
          class="px-6 py-2 rounded-lg border transition-all {$selectedDifficulty === diff.id 
            ? 'border-accent bg-accent/10 text-accent' 
            : 'border-border hover:border-gray-500'}"
          on:click={() => selectedDifficulty.set(diff.id)}
        >
          {diff.label}
        </button>
      {/each}
    </div>
  </div>

  <button
    class="px-8 py-3 bg-accent text-bg font-bold rounded-lg hover:bg-accent/80 transition-colors"
    on:click={startTest}
  >
    Start (or press Enter)
  </button>
</div>
