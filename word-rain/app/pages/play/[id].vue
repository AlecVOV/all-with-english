<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { GameWord } from '../../composables/useGameState';

const route = useRoute();
const { getWordSetWithWords } = useWordSets();

const title = ref('');
const words = ref<GameWord[]>([]);
const loading = ref(true);
const error = ref('');
const result = ref<{ score: number; misses: number; seconds: number } | null>(null);
const gameKey = ref(0); // bump to force-remount the game component on replay

const wordSetId = computed(() => String(route.params.id));

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const { wordSet, words: fetched } = await getWordSetWithWords(wordSetId.value);
    title.value = wordSet.title;
    words.value = fetched.map((w) => ({ id: w.id, term: w.term, meaning: w.meaning }));
  } catch (e: any) {
    error.value = e.message ?? 'Không tải được bài học';
  } finally {
    loading.value = false;
  }
}

function handleFinished(r: { score: number; misses: number; seconds: number }) {
  result.value = r;
}

function playAgain() {
  result.value = null;
  gameKey.value += 1;
}

onMounted(load);
</script>

<template>
  <main class="page">
    <NuxtLink to="/" class="back-link">← Danh sách bài học</NuxtLink>

    <p v-if="loading">Đang tải...</p>
    <p v-else-if="error" class="error">{{ error }}</p>

    <template v-else>
      <h1>{{ title }}</h1>

      <div v-if="result" class="result-card">
        <h2>Kết quả</h2>
        <p>✅ Số từ đúng: {{ result.score }}</p>
        <p>❌ Số lần trượt: {{ result.misses }}</p>
        <p>⏱️ Thời gian: {{ result.seconds }} giây</p>
        <div class="result-actions">
          <button class="btn primary" @click="playAgain">Chơi lại</button>
          <NuxtLink class="btn" to="/">Về danh sách</NuxtLink>
        </div>
      </div>

      <WordRainGame v-else :key="gameKey" :words="words" @finished="handleFinished" />
    </template>
  </main>
</template>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: #3b82f6;
  text-decoration: none;
}
.error {
  color: #b91c1c;
}
.result-card {
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}
.result-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1rem;
}
.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  background: white;
  text-decoration: none;
  color: #111;
  cursor: pointer;
  font-size: 1rem;
}
.btn.primary {
  background: #16a34a;
  color: white;
  border-color: #16a34a;
}
</style>
