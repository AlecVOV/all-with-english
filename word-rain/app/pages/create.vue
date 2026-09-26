<script setup lang="ts">
import { ref } from 'vue';
import type { WordInput } from '../composables/useWordSets';

const { createWordSet } = useWordSets();
const router = useRouter();
const formRef = ref();

async function handleSubmit(title: string, words: WordInput[]) {
  try {
    const wordSet = await createWordSet(title, words);
    router.push('/');
  } catch (e: any) {
    formRef.value?.setError(e.message ?? 'Có lỗi xảy ra, thử lại nhé');
    formRef.value?.setSubmitting(false);
  }
}
</script>

<template>
  <main class="page">
    <NuxtLink to="/" class="back-link">← Danh sách bài học</NuxtLink>
    <h1>Nhập từ vựng mới</h1>
    <WordSetForm ref="formRef" @submit="handleSubmit" />
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
</style>
