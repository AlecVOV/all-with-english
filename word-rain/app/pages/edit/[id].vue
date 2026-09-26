<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { WordInput } from '../../composables/useWordSets';

const route = useRoute();
const router = useRouter();
const { getWordSetWithWords, updateWordSet } = useWordSets();

const wordSetId = computed(() => String(route.params.id));
const loading = ref(true);
const loadError = ref('');
const initialTitle = ref('');
const initialWords = ref<WordInput[]>([]);
const formRef = ref();

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const { wordSet, words } = await getWordSetWithWords(wordSetId.value);
    initialTitle.value = wordSet.title;
    initialWords.value = words.map((w) => ({ term: w.term, meaning: w.meaning }));
  } catch (e: any) {
    loadError.value = e.message ?? 'Không tải được bài học';
  } finally {
    loading.value = false;
  }
}

async function handleSubmit(title: string, words: WordInput[]) {
  try {
    await updateWordSet(wordSetId.value, title, words);
    router.push('/');
  } catch (e: any) {
    formRef.value?.setError(e.message ?? 'Có lỗi xảy ra, thử lại nhé');
    formRef.value?.setSubmitting(false);
  }
}

onMounted(load);
</script>

<template>
  <main class="page">
    <NuxtLink to="/" class="back-link">← Danh sách bài học</NuxtLink>
    <h1>Sửa bài học</h1>

    <p v-if="loading">Đang tải...</p>
    <p v-else-if="loadError" class="error">{{ loadError }}</p>
    <WordSetForm
      v-else
      ref="formRef"
      :initial-title="initialTitle"
      :initial-words="initialWords"
      submit-label="Cập nhật bài học"
      @submit="handleSubmit"
    />
  </main>
</template>

<style scoped>
.page {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: #3b82f6;
  text-decoration: none;
}
h1 {
  margin-bottom: 1.5rem;
}
.error {
  color: #b91c1c;
}
</style>
