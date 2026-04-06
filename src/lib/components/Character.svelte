<!-- src/lib/components/Character.svelte -->
<script lang="ts">
  import type { CharState } from '../stores/game';

  export let char: CharState;
  export let isCursor = false;

  $: displayChar = char.char === '\n' ? '↵' : char.char === '\t' ? '→' : char.char === ' ' ? '·' : char.char;
</script>

<span
  class="inline-block relative transition-colors duration-75
    {char.state === 'correct' ? 'text-correct' : ''}
    {char.state === 'incorrect' ? 'text-incorrect' : ''}
    {char.state === 'pending' ? 'text-pending' : ''}"
>
  {displayChar}
  {#if isCursor}
    <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-accent animate-pulse"></span>
  {/if}
</span>
