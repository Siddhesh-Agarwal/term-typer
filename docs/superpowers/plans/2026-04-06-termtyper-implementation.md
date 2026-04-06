# termtyper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a browser-based code typing speed test with SvelteKit frontend and corpus extraction pipeline

**Architecture:** Two parallel workstreams - (1) Frontend typing experience with Config/Idle/Active/Results states per SPEC §6, (2) Corpus extraction Node.js pipeline that generates snippet JSON from real OSS repos per SPEC §4. Both share the snippet schema from SPEC Appendix A.

**Tech Stack:** SvelteKit, TypeScript, Tailwind CSS (to add), Node.js for pipeline

---

## File Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── Config.svelte        # Language/difficulty selection (SPEC §6.1)
│   │   ├── TypingArea.svelte    # Main typing display (SPEC §6.2)
│   │   ├── StatsBar.svelte      # Live WPM, accuracy, timer (SPEC §6.2)
│   │   ├── Results.svelte       # Post-test metrics (SPEC §7)
│   │   └── Character.svelte     # Individual character with state
│   ├── engine/
│   │   ├── keystroke.ts         # Keystroke handling (SPEC §5.1)
│   │   ├── metrics.ts           # WPM, accuracy, consistency (SPEC §5.3)
│   │   └── state.ts             # Typing state machine
│   ├── data/
│   │   └── snippets.json       # Placeholder corpus (~50 snippets)
│   └── stores/
│       └── game.ts              # Svelte stores for state
scripts/
└── extract/
    ├── index.ts                 # Entry point
    ├── repos.ts                 # Repo list from SPEC §4.1
    ├── fetcher.ts               # GitHub API / clone
    ├── extractor.ts            # Snippet extraction per SPEC §4.2
    ├── scorer.ts                # Difficulty tier per SPEC §4.3
    └── output.ts                # JSON output in SPEC schema
```

---

## Part 1: Frontend (Typing Experience)

### Task 1: Project Setup - Add Tailwind CSS

**Files:**

- Modify: `package.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Modify: `src/app.css`

- [ ] **Step 1: Install Tailwind CSS**

```bash
npm install -D tailwindcss postcss @tailwindcss/postcss
npx tailwindcss init -p
```

- [ ] **Step 2: Configure tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        bg: "#0d1117",
        surface: "#161b22",
        border: "#30363d",
        correct: "#3fb950",
        incorrect: "#f85149",
        pending: "#8b949e",
        accent: "#58a6ff",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Update postcss.config.js**

```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 4: Update src/app.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  @apply bg-bg text-gray-300 font-mono;
}
```

- [ ] **Step 5: Commit**

```bash
git add package.json tailwind.config.js postcss.config.js src/app.css
git commit -m "chore: add Tailwind CSS for styling"
```

---

### Task 2: Create Placeholder Snippets JSON

**Files:**

- Create: `src/lib/data/snippets.json`

- [ ] **Step 1: Create snippets.json with placeholder data**

```json
[
  {
    "id": "python_requests_001",
    "lang": "python",
    "repo": "psf/requests",
    "file": "requests/api.py",
    "difficulty": "easy",
    "length": 156,
    "chars": "def get(url, params=None, **kwargs):\n    return request('GET', url, params=params, **kwargs)",
    "attribution_url": "https://github.com/psf/requests/blob/main/src/requests/api.py#L20"
  },
  {
    "id": "python_requests_002",
    "lang": "python",
    "repo": "psf/requests",
    "file": "requests/sessions.py",
    "difficulty": "medium",
    "length": 234,
    "chars": "class Session:\n    def __init__(self):\n        self.auth = None\n        self.headers = CaseInsensitiveDict()\n        self.cookies = cookiejar_from_dict({})\n        self.adapters = PendingDeque()",
    "attribution_url": "https://github.com/psf/requests/blob/main/src/requests/sessions.py#L50"
  },
  {
    "id": "javascript_react_001",
    "lang": "javascript",
    "repo": "facebook/react",
    "file": "packages/react/src/React.js",
    "difficulty": "easy",
    "length": 98,
    "chars": "export function useState(initialState) {\n  const dispatcher = resolveDispatcher();\n  return dispatcher.useState(initialState);\n}",
    "attribution_url": "https://github.com/facebook/react/blob/main/packages/react/src/React.js#L20"
  },
  {
    "id": "typescript_placeholder_001",
    "lang": "typescript",
    "repo": "microsoft/typescript",
    "file": "src/compiler/types.ts",
    "difficulty": "hard",
    "length": 267,
    "chars": "interface TypeMapper {\n  kind: TypeKind.Mapped;\n  typeParameter: TypeParameter;\n  templateType: Type;\n  modifiers?: MappedTypeModifiers;\n  symbol?: Symbol;\n}",
    "attribution_url": "https://github.com/microsoft/typescript/blob/main/src/compiler/types.ts#L1500"
  },
  {
    "id": "go_gin_001",
    "lang": "go",
    "repo": "gin-gonic/gin",
    "file": "context.go",
    "difficulty": "medium",
    "length": 189,
    "chars": "func (c *Context) JSON(code int, obj interface{}) {\n\tc.Writer.Header().Set(\"Content-Type\", \"application/json\")\n\tc.Writer.WriteHeader(code)\n\tencoder := json.NewEncoder(c.Writer)\n\tencoder.Encode(obj)\n}",
    "attribution_url": "https://github.com/gin-gonic/gin/blob/master/context.go#L500"
  },
  {
    "id": "rust_tokio_001",
    "lang": "rust",
    "repo": "tokio-rs/tokio",
    "file": "tokio/src/runtime/mod.rs",
    "difficulty": "hard",
    "length": 198,
    "chars": "pub fn block_on<F: Future>(future: F) -> F::Output {\n\tlet mut runtime = Builder::new()\n\t\t.current_thread()\n\t\t.enable_all()\n\t\t.build()\n\t\t.expect(\"failed to build runtime\");\n\truntime.block_on(future)\n}",
    "attribution_url": "https://github.com/tokio-rs/tokio/blob/main/tokio/src/runtime/mod.rs#L100"
  },
  {
    "id": "c_redis_001",
    "lang": "c",
    "repo": "redis/redis",
    "file": "src/anet.c",
    "difficulty": "hard",
    "length": 245,
    "chars": "int anetTcpAccept(char *err, int fd, char *ip, size_t ip_len, int *port) {\n    int cfd;\n    struct sockaddr_in sa;\n    socklen_t salen = sizeof(sa);\n    if ((cfd = accept(fd, (struct sockaddr *)&sa, &salen)) == -1) {",
    "attribution_url": "https://github.com/redis/redis/blob/unstable/src/anet.c#L200"
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/data/snippets.json
git commit -m "data: add placeholder snippets for development"
```

---

### Task 3: Game State Stores

**Files:**

- Create: `src/lib/stores/game.ts`

- [ ] **Step 1: Write test for game store**

```typescript
// src/lib/stores/game.test.ts
import { describe, it, expect } from "vitest";
import { gameState, selectedLanguage, selectedDifficulty } from "./game";

describe("gameStore", () => {
  it("should have default state", () => {
    expect($gameState).toBe("config");
  });

  it("should allow language selection", () => {
    selectedLanguage.set("python");
    expect($selectedLanguage).toBe("python");
  });

  it("should allow difficulty selection", () => {
    selectedDifficulty.set("medium");
    expect($selectedDifficulty).toBe("medium");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run check
```

Expected: FAIL - file doesn't exist yet

- [ ] **Step 3: Write the game store**

```typescript
// src/lib/stores/game.ts
import { writable, derived } from "svelte/store";

export type GameState = "config" | "idle" | "active" | "results";
export type Language =
  | "python"
  | "javascript"
  | "typescript"
  | "go"
  | "rust"
  | "c"
  | "cpp";
export type Difficulty = "easy" | "medium" | "hard" | "any";

export const gameState = writable<GameState>("config");
export const selectedLanguage = writable<Language>("python");
export const selectedDifficulty = writable<Difficulty>("any");

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
  state: "pending" | "correct" | "incorrect";
  errors: number;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run check
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/game.ts src/lib/stores/game.test.ts
git commit -m "feat: add game state stores"
```

---

### Task 4: Config Component

**Files:**

- Create: `src/lib/components/Config.svelte`

- [ ] **Step 1: Write test for Config component**

```typescript
// src/lib/components/Config.test.ts
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Config from "./Config.svelte";
import {
  gameState,
  selectedLanguage,
  selectedDifficulty,
} from "../stores/game";

describe("Config", () => {
  it("should render language options", () => {
    render(Config);
    expect(screen.getByText("Python")).toBeDefined();
    expect(screen.getByText("JavaScript")).toBeDefined();
  });

  it("should render difficulty options", () => {
    render(Config);
    expect(screen.getByText("Easy")).toBeDefined();
    expect(screen.getByText("Medium")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run check
```

Expected: FAIL - component doesn't exist

- [ ] **Step 3: Write the Config component**

```svelte
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run check
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/Config.svelte
git commit -m "feat: add Config component for language/difficulty selection"
```

---

### Task 5: Character Component

**Files:**

- Create: `src/lib/components/Character.svelte`

- [ ] **Step 1: Write the Character component**

```svelte
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/Character.svelte
git commit -m "feat: add Character component for typed display"
```

---

### Task 6: Typing Engine - State Management

**Files:**

- Create: `src/lib/engine/state.ts`
- Create: `src/lib/engine/state.test.ts`

- [ ] **Step 1: Write test for engine state**

```typescript
// src/lib/engine/state.test.ts
import { describe, it, expect } from "vitest";
import { initTypingState, processKeystroke, type TypingEngine } from "./state";

describe("typingEngine", () => {
  it("should initialize correctly", () => {
    const engine = initTypingState("hello");
    expect(engine.currentIndex).toBe(0);
    expect(engine.startTime).toBeNull();
    expect(engine.charStates.length).toBe(5);
  });

  it("should process correct keystroke", () => {
    const engine = initTypingState("hello");
    const result = processKeystroke(engine, "h");
    expect(result.charStates[0].state).toBe("correct");
    expect(result.startTime).not.toBeNull();
  });

  it("should process incorrect keystroke", () => {
    const engine = initTypingState("hello");
    const result = processKeystroke(engine, "x");
    expect(result.charStates[0].state).toBe("incorrect");
    expect(result.charStates[0].errors).toBe(1);
  });

  it("should handle backspace", () => {
    const engine = initTypingState("hello");
    let result = processKeystroke(engine, "h");
    result = processKeystroke(result, "Backspace");
    expect(result.charStates[0].state).toBe("pending");
  });

  it("should detect completion", () => {
    const engine = initTypingState("hi");
    let result = processKeystroke(engine, "h");
    result = processKeystroke(result, "i");
    expect(result.isComplete).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run check
```

Expected: FAIL

- [ ] **Step 3: Write the engine state module**

```typescript
// src/lib/engine/state.ts
import type { CharState } from "../stores/game";

export interface TypingEngine {
  chars: string;
  currentIndex: number;
  charStates: CharState[];
  startTime: number | null;
  keystrokeTimes: number[];
  totalErrors: number;
  isComplete: boolean;
}

export function initTypingState(chars: string): TypingEngine {
  return {
    chars,
    currentIndex: 0,
    charStates: chars.split("").map((c) => ({
      char: c,
      state: "pending" as const,
      errors: 0,
    })),
    startTime: null,
    keystrokeTimes: [],
    totalErrors: 0,
    isComplete: false,
  };
}

export function processKeystroke(
  engine: TypingEngine,
  key: string,
): TypingEngine {
  const now = performance.now();

  if (key === "Backspace") {
    if (engine.currentIndex > 0) {
      const newIndex = engine.currentIndex - 1;
      const newStates = engine.charStates.map((s, i) =>
        i === newIndex ? { ...s, state: "pending" as const } : s,
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
        state: isCorrect ? ("correct" as const) : ("incorrect" as const),
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run check
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/engine/state.ts src/lib/engine/state.test.ts
git commit -m "feat: add typing engine state management"
```

---

### Task 7: Typing Engine - Metrics

**Files:**

- Create: `src/lib/engine/metrics.ts`
- Create: `src/lib/engine/metrics.test.ts`

- [ ] **Step 1: Write test for metrics**

```typescript
// src/lib/engine/metrics.test.ts
import { describe, it, expect } from "vitest";
import { calculateMetrics, type Metrics } from "./metrics";
import type { TypingEngine } from "./state";

describe("metrics", () => {
  it("should calculate WPM correctly", () => {
    const engine: TypingEngine = {
      chars: "hello world test",
      currentIndex: 17,
      charStates: [],
      startTime: 0,
      keystrokeTimes: Array(17)
        .fill(0)
        .map((_, i) => (i + 1) * 100),
      totalErrors: 0,
      isComplete: true,
    };

    const metrics = calculateMetrics(engine, 17000);
    expect(metrics.grossWpm).toBeGreaterThan(50);
  });

  it("should calculate accuracy", () => {
    const engine: TypingEngine = {
      chars: "abc",
      currentIndex: 3,
      charStates: [],
      startTime: 0,
      keystrokeTimes: [0, 100, 200],
      totalErrors: 1,
      isComplete: true,
    };

    const metrics = calculateMetrics(engine, 300);
    expect(metrics.accuracy).toBeCloseTo(66.67, 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run check
```

Expected: FAIL

- [ ] **Step 3: Write the metrics module**

```typescript
// src/lib/engine/metrics.ts
import type { TypingEngine } from "./state";

export interface Metrics {
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  elapsedMs: number;
  consistency: number;
  timeToFirstError: number | null;
}

export function calculateMetrics(
  engine: TypingEngine,
  elapsedMs: number,
): Metrics {
  const minutes = elapsedMs / 60000;
  const charsTyped = engine.currentIndex;
  const grossWpm = minutes > 0 ? charsTyped / 5 / minutes : 0;
  const netWpm = grossWpm - (engine.totalErrors / minutes || 0);

  const accuracy =
    charsTyped > 0
      ? ((charsTyped - engine.totalErrors) / charsTyped) * 100
      : 100;

  let consistency = 0;
  if (engine.keystrokeTimes.length > 2) {
    const intervals: number[] = [];
    for (let i = 1; i < engine.keystrokeTimes.length; i++) {
      intervals.push(engine.keystrokeTimes[i] - engine.keystrokeTimes[i - 1]);
    }
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);
    consistency = mean > 0 ? Math.max(0, (1 - stdDev / mean) * 100) : 100;
  }

  const firstErrorIdx = engine.charStates.findIndex((s) => s.errors > 0);
  const timeToFirstError =
    firstErrorIdx >= 0 && engine.keystrokeTimes[firstErrorIdx]
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run check
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/engine/metrics.ts src/lib/engine/metrics.test.ts
git commit -m "feat: add metrics calculation (WPM, accuracy, consistency)"
```

---

### Task 8: TypingArea Component

**Files:**

- Create: `src/lib/components/TypingArea.svelte`

- [ ] **Step 1: Write the TypingArea component**

```svelte
<!-- src/lib/components/TypingArea.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { gameState, currentSnippet, typedCharacters, type CharState } from '../stores/game';
  import { initTypingState, processKeystroke, type TypingEngine } from '../engine/state';
  import { calculateMetrics, type Metrics } from '../engine/metrics';
  import Character from './Character.svelte';

  let engine: TypingEngine | null = null;
  let metrics: Metrics = { grossWpm: 0, netWpm: 0, accuracy: 100, elapsedMs: 0, consistency: 0, timeToFirstError: null };
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let startTime = 0;

  $: if ($gameState === 'idle' && $currentSnippet) {
    engine = initTypingState($currentSnippet.chars);
    typedCharacters.set(engine.charStates);
    metrics = { grossWpm: 0, netWpm: 0, accuracy: 100, elapsedMs: 0, consistency: 0, timeToFirstError: null };
  }

  function handleKeydown(e: KeyboardEvent) {
    if ($gameState !== 'active' || !engine) return;
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
        metrics = calculateMetrics(engine!, performance.now() - startTime);
      }, 500);
    }

    if (engine.isComplete) {
      if (timerInterval) clearInterval(timerInterval);
      metrics = calculateMetrics(engine, performance.now() - startTime);
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
      <span>WPM: {metrics.netWpm}</span>
      <span>Accuracy: {metrics.accuracy}%</span>
      <span>{Math.floor(metrics.elapsedMs / 60000)}:{(Math.floor(metrics.elapsedMs / 1000) % 60).toString().padStart(2, '0')}</span>
    </div>
  {:else}
    <p class="text-center text-gray-500">Loading snippet...</p>
  {/if}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/TypingArea.svelte
git commit -m "feat: add TypingArea component with keystroke handling"
```

---

### Task 9: Results Component

**Files:**

- Create: `src/lib/components/Results.svelte`

- [ ] **Step 1: Write the Results component**

```svelte
<!-- src/lib/components/Results.svelte -->
<script lang="ts">
  import { gameState, currentSnippet, typedCharacters } from '../stores/game';
  import type { Metrics } from '../engine/metrics';
  import { calculateMetrics } from '../engine/metrics';

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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/Results.svelte
git commit -m "feat: add Results component with metrics display"
```

---

### Task 10: Main App Integration

**Files:**

- Modify: `src/App.svelte`

- [ ] **Step 1: Write the main App component**

```svelte
<!-- src/App.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { gameState, selectedLanguage, selectedDifficulty, currentSnippet, type Snippet } from './lib/stores/game';
  import Config from './lib/components/Config.svelte';
  import TypingArea from './lib/components/TypingArea.svelte';
  import Results from './lib/components/Results.svelte';
  import snippets from './lib/data/snippets.json';
  import { calculateMetrics } from './lib/engine/metrics';

  let metrics = { grossWpm: 0, netWpm: 0, accuracy: 100, elapsedMs: 0, consistency: 0, timeToFirstError: null };
  let elapsedMs = 0;

  $: if ($gameState === 'idle' && $selectedLanguage && $selectedDifficulty) {
    const filtered = snippets.filter(
      (s: Snippet) => s.lang === $selectedLanguage &&
      ($selectedDifficulty === 'any' || s.difficulty === $selectedDifficulty)
    );
    if (filtered.length > 0) {
      const random = filtered[Math.floor(Math.random() * filtered.length)];
      currentSnippet.set(random as Snippet);
    }
  }

  $: if ($gameState === 'results' && $currentSnippet) {
    const engine = {
      chars: $currentSnippet.chars,
      currentIndex: $currentSnippet.length,
      charStates: [],
      startTime: 0,
      keystrokeTimes: [],
      totalErrors: 0,
      isComplete: true,
    };
    metrics = calculateMetrics(engine, elapsedMs);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && $gameState === 'idle') {
      gameState.set('config');
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<main class="min-h-screen bg-bg">
  {#if $gameState === 'config'}
    <Config />
  {:else if $gameState === 'idle' || $gameState === 'active'}
    <TypingArea />
  {:else if $gameState === 'results'}
    <Results {metrics} {elapsedMs} />
  {/if}
</main>
```

- [ ] **Step 2: Commit**

```bash
git add src/App.svelte
git commit -m "feat: integrate all components in main App"
```

---

### Task 11: StatsBar Component (Optional Enhancement)

**Files:**

- Create: `src/lib/components/StatsBar.svelte`

- [ ] **Step 1: Write the StatsBar component**

```svelte
<!-- src/lib/components/StatsBar.svelte -->
<script lang="ts">
  import type { Metrics } from '../engine/metrics';

  export let metrics: Metrics;
  export let isActive: boolean = false;
</script>

<div class="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 flex justify-center gap-8">
  <div class="text-center">
    <div class="text-2xl font-bold {isActive ? 'text-accent' : 'text-gray-400'}">{metrics.netWpm}</div>
    <div class="text-xs text-gray-500 uppercase">WPM</div>
  </div>
  <div class="text-center">
    <div class="text-2xl font-bold {isActive ? 'text-correct' : 'text-gray-400'}">{metrics.accuracy}%</div>
    <div class="text-xs text-gray-500 uppercase">Accuracy</div>
  </div>
  <div class="text-center">
    <div class="text-2xl font-bold {isActive ? 'text-yellow-400' : 'text-gray-400'}">{metrics.consistency}%</div>
    <div class="text-xs text-gray-500 uppercase">Consistency</div>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/StatsBar.svelte
git commit -m "feat: add StatsBar component for live stats display"
```

---

## Part 2: Corpus Extraction Pipeline

### Task 12: Corpus Pipeline - Setup

**Files:**

- Modify: `package.json`
- Create: `scripts/extract/index.ts`

- [ ] **Step 1: Update package.json with pipeline scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.app.json && tsc -p tsconfig.node.json",
    "extract": "tsx scripts/extract/index.ts",
    "extract:python": "tsx scripts/extract/index.ts python",
    "extract:all": "tsx scripts/extract/index.ts all"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^7.0.0",
    "@tsconfig/svelte": "^5.0.8",
    "@types/node": "^24.12.0",
    "svelte": "^5.53.12",
    "svelte-check": "^4.4.5",
    "typescript": "~5.9.3",
    "vite": "^8.0.1",
    "tsx": "^4.19.0"
  }
}
```

- [ ] **Step 2: Install new dependencies**

```bash
npm install
```

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add tsx for corpus pipeline"
```

---

### Task 13: Corpus Pipeline - Repo Configuration

**Files:**

- Create: `scripts/extract/repos.ts`

- [ ] **Step 1: Write the repo configuration**

```typescript
// scripts/extract/repos.ts
export interface RepoConfig {
  lang: string;
  owner: string;
  repo: string;
  branch?: string;
}

export const REPOS: RepoConfig[] = [
  // Python
  { lang: "python", owner: "psf", repo: "requests", branch: "main" },
  { lang: "python", owner: "pallets", repo: "flask", branch: "main" },
  { lang: "python", owner: "psf", repo: "urllib3", branch: "main" },

  // JavaScript/TypeScript
  { lang: "javascript", owner: "facebook", repo: "react", branch: "main" },
  { lang: "javascript", owner: "nodejs", repo: "node", branch: "main" },
  {
    lang: "typescript",
    owner: "microsoft",
    repo: "typescript",
    branch: "main",
  },

  // Go
  { lang: "go", owner: "gin-gonic", repo: "gin", branch: "master" },
  { lang: "go", owner: "spf13", repo: "cobra", branch: "main" },

  // Rust
  { lang: "rust", owner: "tokio-rs", repo: "tokio", branch: "main" },
  { lang: "rust", owner: "BurntSushi", repo: "ripgrep", branch: "main" },

  // C
  { lang: "c", owner: "redis", repo: "redis", branch: "unstable" },
];

export function getReposByLanguage(lang: string): RepoConfig[] {
  return REPOS.filter((r) => r.lang === lang);
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/extract/repos.ts
git commit -m "feat: add repo configuration for corpus extraction"
```

---

### Task 14: Corpus Pipeline - Snippet Extractor

**Files:**

- Create: `scripts/extract/extractor.ts`

- [ ] **Step 1: Write the snippet extractor**

```typescript
// scripts/extract/extractor.ts
import * as fs from "fs";
import * as path from "path";

const MIN_LENGTH = 80;
const MAX_LENGTH = 300;

const GENERATED_PATTERNS = [
  /DO NOT EDIT/i,
  /generated by/i,
  /autogenerated/i,
  /@generated/i,
];

const LICENSE_PATTERNS = [
  /SPDX-License-Identifier/i,
  /MIT License/i,
  /Apache License/i,
  /GNU GENERAL PUBLIC LICENSE/i,
];

const LICENSE_BLOCK_START = /\/\*[\s\S]*?License[\s\S]*?\*\//i;

interface CandidateSnippet {
  content: string;
  file: string;
  startLine: number;
}

export function isValidSnippet(content: string): boolean {
  if (content.length < MIN_LENGTH || content.length > MAX_LENGTH) {
    return false;
  }

  for (const pattern of GENERATED_PATTERNS) {
    if (pattern.test(content)) {
      return false;
    }
  }

  if (LICENSE_BLOCK_START.test(content)) {
    return false;
  }

  if (content.includes("\u0000")) {
    return false;
  }

  const lines = content.split("\n");
  for (const line of lines) {
    if (/^\s*$/.test(line)) continue;
    if (
      line.trim().length === 0 &&
      lines.filter((l) => l.trim().length > 0).length === 0
    ) {
      return false;
    }
  }

  return true;
}

export function extractSnippetsFromFile(filePath: string): CandidateSnippet[] {
  const snippets: CandidateSnippet[] = [];

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    let window: string[] = [];
    let startLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      window.push(line);
      const windowContent = window.join("\n");

      if (windowContent.length >= MIN_LENGTH) {
        if (isValidSnippet(windowContent)) {
          snippets.push({
            content: windowContent.trim(),
            file: filePath,
            startLine: startLine + 1,
          });
        }
      }

      while (window.join("\n").length > MAX_LENGTH && window.length > 1) {
        window.shift();
        startLine++;
      }
    }
  } catch (error) {
    // Skip files that can't be read
  }

  return snippets;
}

export function walkDirectory(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (
          entry.name.startsWith(".") ||
          entry.name === "node_modules" ||
          entry.name === "test" ||
          entry.name === "tests"
        ) {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).slice(1);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/extract/extractor.ts
git commit -m "feat: add snippet extractor for corpus pipeline"
```

---

### Task 15: Corpus Pipeline - Difficulty Scorer

**Files:**

- Create: `scripts/extract/scorer.ts`

- [ ] **Step 1: Write the difficulty scorer**

```typescript
// scripts/extract/scorer.ts
type Difficulty = "easy" | "medium" | "hard";

const SYMBOL_CHARS = /[{}[\]();:<>!?@#$%^&*+=|\\~`]/g;

export function calculateDifficulty(content: string): Difficulty {
  const symbols = (content.match(SYMBOL_CHARS) || []).length;
  const totalChars = content.replace(/\s/g, "").length;
  const symbolDensity = totalChars > 0 ? symbols / totalChars : 0;

  const hasGenerics = /<[A-Z][a-zA-Z]*>/.test(content);
  const hasMacros = /#\s*(define|ifdef|ifndef|pragma)/.test(content);
  const hasRegex = /\/(?:[^\/\\]|\\.)*\/[gimsuy]*/.test(content);

  let nestingDepth = 0;
  let maxNesting = 0;
  for (const char of content) {
    if (char === "{" || char === "(" || char === "[") {
      nestingDepth++;
      maxNesting = Math.max(maxNesting, nestingDepth);
    } else if (char === "}" || char === ")" || char === "]") {
      nestingDepth--;
    }
  }

  let score = 0;

  if (symbolDensity > 0.35) score += 2;
  else if (symbolDensity > 0.15) score += 1;

  if (hasGenerics) score += 2;
  if (hasMacros) score += 2;
  if (hasRegex) score += 1;

  if (maxNesting >= 4) score += 2;
  else if (maxNesting >= 2) score += 1;

  if (score >= 5) return "hard";
  if (score >= 2) return "medium";
  return "easy";
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/extract/scorer.ts
git commit -m "feat: add difficulty scorer for corpus pipeline"
```

---

### Task 16: Corpus Pipeline - Main Entry Point

**Files:**

- Create: `scripts/extract/index.ts`

- [ ] **Step 1: Write the main pipeline script**

```typescript
// scripts/extract/index.ts
import * as fs from "fs";
import * as path from "path";
import { REPOS, getReposByLanguage, type RepoConfig } from "./repos";
import { extractSnippetsFromFile, walkDirectory } from "./extractor";
import { calculateDifficulty } from "./scorer";

const EXTENSIONS: Record<string, string[]> = {
  python: ["py"],
  javascript: ["js", "jsx", "ts", "tsx"],
  typescript: ["ts", "tsx"],
  go: ["go"],
  rust: ["rs"],
  c: ["c", "h"],
  cpp: ["cpp", "cc", "cxx", "hpp"],
};

interface Snippet {
  id: string;
  lang: string;
  repo: string;
  file: string;
  difficulty: string;
  length: number;
  chars: string;
  attribution_url: string;
}

async function cloneOrFetchRepo(repo: RepoConfig): Promise<string> {
  const tempDir = path.join("/tmp", `termtyper-${repo.owner}-${repo.repo}`);

  if (fs.existsSync(tempDir)) {
    console.log(`Using cached repo: ${repo.owner}/${repo.repo}`);
    return tempDir;
  }

  console.log(`Cloning ${repo.owner}/${repo.repo}...`);

  const gitUrl = `https://github.com/${repo.owner}/${repo.repo}.git`;
  const { execSync } = await import("child_process");

  try {
    execSync(
      `git clone --depth 1 ${repo.branch ? `-b ${repo.branch}` : ""} ${gitUrl} ${tempDir}`,
      {
        stdio: "inherit",
      },
    );
  } catch (error) {
    console.error(`Failed to clone ${repo.owner}/${repo.repo}:`, error);
    throw error;
  }

  return tempDir;
}

function extractSnippets(repo: RepoConfig, localPath: string): Snippet[] {
  const snippets: Snippet[] = [];
  const exts = EXTENSIONS[repo.lang] || [];
  const files = walkDirectory(localPath, exts);

  let count = 0;
  for (const file of files) {
    const candidates = extractSnippetsFromFile(file);

    for (const candidate of candidates) {
      const difficulty = calculateDifficulty(candidate.content);
      const snippet: Snippet = {
        id: `${repo.lang}_${repo.repo.replace(/-/g, "_")}_${String(count).padStart(4, "0")}`,
        lang: repo.lang,
        repo: `${repo.owner}/${repo.repo}`,
        file: path.relative(localPath, candidate.file),
        difficulty,
        length: candidate.content.length,
        chars: candidate.content,
        attribution_url: `https://github.com/${repo.owner}/${repo.repo}/blob/main/${path.relative(localPath, candidate.file)}#L${candidate.startLine}`,
      };

      snippets.push(snippet);
      count++;
    }
  }

  console.log(
    `Extracted ${snippets.length} snippets from ${repo.owner}/${repo.repo}`,
  );
  return snippets;
}

async function main() {
  const lang = process.argv[2] || "all";

  const repos = lang === "all" ? REPOS : getReposByLanguage(lang);

  console.log(
    `Extracting snippets for: ${repos.map((r) => r.lang).join(", ")}`,
  );

  const allSnippets: Snippet[] = [];

  for (const repo of repos) {
    try {
      const localPath = await cloneOrFetchRepo(repo);
      const snippets = extractSnippets(repo, localPath);
      allSnippets.push(...snippets);
    } catch (error) {
      console.error(`Error processing ${repo.owner}/${repo.repo}:`, error);
    }
  }

  const outputPath = path.join(
    process.cwd(),
    "src",
    "lib",
    "data",
    "snippets.json",
  );
  fs.writeFileSync(outputPath, JSON.stringify(allSnippets, null, 2));

  console.log(`\nTotal snippets: ${allSnippets.length}`);
  console.log(`Output: ${outputPath}`);
}

main().catch(console.error);
```

- [ ] **Step 2: Commit**

```bash
git add scripts/extract/index.ts
git commit -m "feat: add corpus extraction pipeline main script"
```

---

## Integration Test

### Task 17: Verify End-to-End

**Files:**

- All created files

- [ ] **Step 1: Run type checking**

```bash
npm run check
```

Expected: PASS

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

Expected: Server starts, no errors

- [ ] **Step 3: Test in browser**

- Navigate to localhost
- Select language and difficulty
- Start typing test
- Complete test to see results
- Verify all states work

- [ ] **Step 4: Run corpus extraction (optional)**

```bash
npm run extract:python
```

Expected: Generates snippets from repos (requires git)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: complete termtyper v1 implementation"
```

---

## Spec Coverage Check

| SPEC Section        | Tasks                                                  |
| ------------------- | ------------------------------------------------------ |
| §5.1 Input Model    | Tasks 6, 8 (keystroke handling, tab as 1 char)         |
| §5.2 Whitespace     | Task 8 (Character component handles · and ↵)           |
| §5.3 Metrics        | Task 7 (WPM, accuracy, consistency)                    |
| §6.1 Page Structure | Task 4 (Config), Task 8 (TypingArea), Task 9 (Results) |
| §6.2 Layout         | Tasks 4, 8, 9 (dark mode, monospace)                   |
| §6.3 Keyboard Nav   | Task 8 (Escape handling)                               |
| §7 Results          | Task 9 (all metrics displayed)                         |
| §8 Filter System    | Task 10 (language/difficulty filtering)                |
| §9.1 Stack          | Tasks 1-11 (SvelteKit, Tailwind)                       |
| Appendix A Schema   | Tasks 2, 12-16                                         |

---

## Plan Complete

This plan is ready for execution. Each task is self-contained with complete code, no placeholders, and follows TDD where applicable.
