<script setup lang="ts">
import { ref, onBeforeUnmount, nextTick } from 'vue';
import type { GameWord, GameSpeed } from '../composables/useGameState';

const props = defineProps<{
  words: GameWord[];
}>();

const emit = defineEmits<{
  finished: [{ score: number; misses: number; seconds: number }];
}>();

const SPEED_KEY = 'wordrain:speed';
const SPEED_OPTIONS: { value: GameSpeed; label: string }[] = [
  { value: 'slow', label: 'Chậm' },
  { value: 'medium', label: 'Vừa' },
  { value: 'fast', label: 'Nhanh' },
];

function loadSavedSpeed(): GameSpeed {
  try {
    const saved = localStorage.getItem(SPEED_KEY);
    if (saved === 'slow' || saved === 'medium' || saved === 'fast') return saved;
  } catch {
    // localStorage unavailable (private mode etc.) — fall back to default
  }
  return 'medium';
}

const game = useGameState();
const typed = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const shake = ref(false);
const started = ref(false);
const selectedSpeed = ref<GameSpeed>(loadSavedSpeed());

let rafId: number | null = null;
let lastTs: number | null = null;

function loop(ts: number) {
  if (lastTs === null) lastTs = ts;
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  game.tick(dt);

  if (game.isFinished.value) {
    emit('finished', {
      score: game.score.value,
      misses: game.misses.value,
      seconds: game.elapsedSeconds.value,
    });
    return;
  }

  rafId = requestAnimationFrame(loop);
}

function startGame(speed: GameSpeed) {
  selectedSpeed.value = speed;
  try {
    localStorage.setItem(SPEED_KEY, speed);
  } catch {
    // ignore — persistence is a convenience, not a requirement
  }
  started.value = true;
  lastTs = null;
  game.start(props.words, speed);
  rafId = requestAnimationFrame(loop);
  nextTick(() => inputRef.value?.focus());
}

function handleSubmit() {
  const ok = game.submit(typed.value);
  if (!ok) {
    shake.value = true;
    setTimeout(() => (shake.value = false), 250);
  }
  typed.value = '';
}

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId);
  game.reset();
});

defineExpose({ restart: () => startGame(selectedSpeed.value) });
</script>

<template>
  <div class="game">
    <div v-if="!started" class="speed-picker">
      <p>Chọn tốc độ rơi:</p>
      <div class="speed-options">
        <button
          v-for="opt in SPEED_OPTIONS"
          :key="opt.value"
          type="button"
          class="speed-btn"
          :class="{ active: opt.value === selectedSpeed }"
          @click="startGame(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <template v-else>
      <div class="hud">
        <span>Điểm: {{ game.score.value }}</span>
        <span>Trượt: {{ game.misses.value }}</span>
        <span>Còn lại: {{ game.remaining.value.length + game.falling.value.length }}</span>
      </div>

      <div class="rain-field">
        <div
          v-for="w in game.falling.value"
          :key="w.fallId"
          class="falling-word"
          :style="{ left: w.x + '%', top: w.y + '%' }"
        >
          {{ w.meaning }}
        </div>
        <div class="ground-line" />
      </div>

      <form class="input-row" :class="{ shake }" @submit.prevent="handleSubmit">
        <input
          ref="inputRef"
          v-model="typed"
          type="text"
          autocomplete="off"
          placeholder="Gõ từ tiếng Anh..."
        />
        <button type="submit">Gửi</button>
      </form>
    </template>
  </div>
</template>

<style scoped>
.game {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.hud {
  display: flex;
  gap: 1.5rem;
  font-weight: 600;
}
.speed-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  background: linear-gradient(#eef2ff, #e0e7ff);
  border-radius: 12px;
  border: 1px solid #c7d2fe;
}
.speed-picker p {
  margin: 0;
  font-weight: 600;
  font-size: 1.1rem;
}
.speed-options {
  display: flex;
  gap: 0.75rem;
}
.speed-btn {
  padding: 0.7rem 1.4rem;
  border: 2px solid #93c5fd;
  border-radius: 10px;
  background: white;
  color: #1e3a8a;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
}
.speed-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}
.rain-field {
  position: relative;
  width: 100%;
  height: 60vh;
  min-height: 320px;
  background: linear-gradient(#eef2ff, #e0e7ff);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #c7d2fe;
}
.falling-word {
  position: absolute;
  transform: translate(-50%, 0);
  background: white;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  font-size: 0.95rem;
  white-space: nowrap;
}
.ground-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #ef4444;
}
.input-row {
  display: flex;
  gap: 0.5rem;
}
.input-row.shake {
  animation: shake 0.25s;
}
.input-row input {
  flex: 1;
  padding: 0.7rem 1rem;
  font-size: 1.1rem;
  border: 2px solid #ccc;
  border-radius: 10px;
}
.input-row button {
  padding: 0.7rem 1.2rem;
  border: none;
  border-radius: 10px;
  background: #3b82f6;
  color: white;
  font-weight: 600;
  cursor: pointer;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}
</style>
