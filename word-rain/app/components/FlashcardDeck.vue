<script setup lang="ts">
import { ref, computed } from 'vue';

interface Card {
  id: string;
  term: string;
  meaning: string;
}

const props = defineProps<{
  cards: Card[];
}>();

const order = ref<number[]>(props.cards.map((_, i) => i));
const index = ref(0);
const flipped = ref(false);

const current = computed(() => props.cards[order.value[index.value]]);
const total = computed(() => props.cards.length);

function next() {
  flipped.value = false;
  index.value = (index.value + 1) % total.value;
}

function prev() {
  flipped.value = false;
  index.value = (index.value - 1 + total.value) % total.value;
}

function flip() {
  flipped.value = !flipped.value;
}

function shuffle() {
  const arr = order.value.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  order.value = arr;
  index.value = 0;
  flipped.value = false;
}
</script>

<template>
  <div class="deck">
    <p class="progress">Thẻ {{ index + 1 }} / {{ total }}</p>

    <div class="card" :class="{ flipped }" @click="flip">
      <div class="card-inner">
        <div class="card-face front">{{ current?.term }}</div>
        <div class="card-face back">{{ current?.meaning }}</div>
      </div>
    </div>
    <p class="hint">Bấm vào thẻ để lật</p>

    <div class="controls">
      <button @click="prev">← Trước</button>
      <button @click="shuffle">🔀 Xáo trộn</button>
      <button @click="next">Sau →</button>
    </div>
  </div>
</template>

<style scoped>
.deck {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.progress {
  color: #666;
  margin: 0;
}
.card {
  width: 100%;
  max-width: 420px;
  height: 260px;
  perspective: 1000px;
  cursor: pointer;
}
.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.5s;
  transform-style: preserve-3d;
}
.card.flipped .card-inner {
  transform: rotateY(180deg);
}
.card-face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  border-radius: 16px;
  backface-visibility: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
.card-face.front {
  background: #3b82f6;
  color: white;
}
.card-face.back {
  background: #f59e0b;
  color: white;
  transform: rotateY(180deg);
}
.hint {
  font-size: 0.85rem;
  color: #999;
  margin: 0;
}
.controls {
  display: flex;
  gap: 0.75rem;
}
.controls button {
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  font-size: 0.95rem;
}
</style>
