<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const route = useRoute();
const { getWordSetWithWords } = useWordSets();

const title = ref('');
const cards = ref<Array<{ id: string; term: string; meaning: string }>>([]);
const loading = ref(true);
const error = ref('');

const wordSetId = computed(() => String(route.params.id));

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const { wordSet, words } = await getWordSetWithWords(wordSetId.value);
    title.value = wordSet.title;
    cards.value = words.map((w) => ({ id: w.id, term: w.term, meaning: w.meaning }));
  } catch (e: any) {
    error.value = e.message ?? 'Không tải được bài học';
  } finally {
    loading.value = false;
  }
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
      <FlashcardDeck v-if="cards.length" :cards="cards" />
      <p v-else>Bài học chưa có từ nào.</p>
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
</style>
