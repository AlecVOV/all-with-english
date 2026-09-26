import { ref, computed } from 'vue';

export interface GameWord {
  id: string;
  term: string;
  meaning: string;
}

export interface FallingWord extends GameWord {
  fallId: number;
  x: number; // percent, 0-100
  y: number; // percent, 0-100 (100 = bottom)
  speed: number; // percent per second
}

export type GameSpeed = 'slow' | 'medium' | 'fast';

interface SpeedPreset {
  base: number; // percent/sec at score 0
  step: number; // speed increase per word correctly typed
  spawnIntervalMs: number;
}

export const SPEED_PRESETS: Record<GameSpeed, SpeedPreset> = {
  slow: { base: 3.5, step: 0.18, spawnIntervalMs: 3200 },
  medium: { base: 6, step: 0.3, spawnIntervalMs: 2200 },
  fast: { base: 9, step: 0.45, spawnIntervalMs: 1600 },
};

/**
 * All game-round state lives here, client-only. "Chơi lại" just calls
 * start() again with the same word list — no DynamoDB read/write needed.
 */
export function useGameState() {
  const queue = ref<GameWord[]>([]);
  const remaining = ref<GameWord[]>([]);
  const falling = ref<FallingWord[]>([]);
  const score = ref(0);
  const misses = ref(0);
  const startedAt = ref<number | null>(null);
  const finishedAt = ref<number | null>(null);
  const isRunning = ref(false);

  let fallCounter = 0;
  let spawnTimer: ReturnType<typeof setInterval> | null = null;
  let preset: SpeedPreset = SPEED_PRESETS.medium;

  const isFinished = computed(
    () => isRunning.value === false && finishedAt.value !== null
  );

  const elapsedSeconds = computed(() => {
    if (!startedAt.value) return 0;
    const end = finishedAt.value ?? Date.now();
    return Math.max(0, Math.round((end - startedAt.value) / 1000));
  });

  function stopSpawning() {
    if (spawnTimer) {
      clearInterval(spawnTimer);
      spawnTimer = null;
    }
  }

  function spawnNext() {
    if (remaining.value.length === 0) return;
    const word = remaining.value.shift()!;
    fallCounter += 1;
    falling.value.push({
      ...word,
      fallId: fallCounter,
      x: 10 + Math.random() * 80,
      y: 0,
      speed: preset.base + score.value * preset.step,
    });
  }

  function start(words: GameWord[], speed: GameSpeed = 'medium') {
    stopSpawning();
    preset = SPEED_PRESETS[speed];
    queue.value = words;
    remaining.value = [...words];
    falling.value = [];
    score.value = 0;
    misses.value = 0;
    startedAt.value = Date.now();
    finishedAt.value = null;
    isRunning.value = true;
    fallCounter = 0;

    spawnNext();
    spawnTimer = setInterval(() => {
      if (remaining.value.length > 0) {
        spawnNext();
      }
    }, preset.spawnIntervalMs);
  }

  function finish() {
    isRunning.value = false;
    finishedAt.value = Date.now();
    stopSpawning();
    falling.value = [];
  }

  /** Advance falling words by dt seconds; returns words that hit the bottom. */
  function tick(dt: number) {
    if (!isRunning.value) return;
    const missedNow: FallingWord[] = [];

    falling.value = falling.value.filter((w) => {
      w.y += w.speed * dt;
      if (w.y >= 100) {
        missedNow.push(w);
        return false;
      }
      return true;
    });

    if (missedNow.length > 0) {
      misses.value += missedNow.length;
      // Missed words go back to the end of the queue to be retried.
      remaining.value.push(...missedNow.map(({ fallId, x, y, speed, ...w }) => w));
    }

    if (
      remaining.value.length === 0 &&
      falling.value.length === 0 &&
      isRunning.value
    ) {
      finish();
    }
  }

  /** Try to match typed text against currently falling words (closest to bottom wins). */
  function submit(typed: string): boolean {
    const normalized = typed.trim().toLowerCase();
    if (!normalized) return false;

    const candidates = falling.value
      .filter((w) => w.term.trim().toLowerCase() === normalized)
      .sort((a, b) => b.y - a.y);

    const hit = candidates[0];
    if (!hit) return false;

    falling.value = falling.value.filter((w) => w.fallId !== hit.fallId);
    score.value += 1;

    if (
      remaining.value.length === 0 &&
      falling.value.length === 0 &&
      isRunning.value
    ) {
      finish();
    }

    return true;
  }

  function reset() {
    stopSpawning();
    queue.value = [];
    remaining.value = [];
    falling.value = [];
    score.value = 0;
    misses.value = 0;
    startedAt.value = null;
    finishedAt.value = null;
    isRunning.value = false;
  }

  return {
    queue,
    remaining,
    falling,
    score,
    misses,
    isRunning,
    isFinished,
    elapsedSeconds,
    start,
    tick,
    submit,
    finish,
    reset,
  };
}
