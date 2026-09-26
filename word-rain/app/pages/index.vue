<script setup lang="ts">
import { ref, onMounted } from 'vue';

const { listWordSets, deleteWordSet } = useWordSets();
const wordSets = ref<Awaited<ReturnType<typeof listWordSets>>>([]);
const loading = ref(true);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    wordSets.value = await listWordSets();
  } catch (e: any) {
    error.value = e.message ?? 'Không tải được danh sách bài học';
  } finally {
    loading.value = false;
  }
}

async function handleDelete(id: string) {
  if (!confirm('Xoá bài học này? Không thể hoàn tác.')) return;
  try {
    await deleteWordSet(id);
    wordSets.value = wordSets.value.filter((w) => w.id !== id);
  } catch (e: any) {
    error.value = e.message ?? 'Không xoá được bài học';
  }
}

onMounted(load);
</script>

<template>
  <main class="page">
    <header class="page-header">
      <h1>🌧️ Word Rain</h1>
      <NuxtLink to="/create" class="btn-create">+ Bài học mới</NuxtLink>
    </header>

    <p v-if="loading">Đang tải...</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <template v-else>
      <p v-if="wordSets.length === 0" class="empty">
        Chưa có bài học nào. Bấm "Bài học mới" để bắt đầu nhập từ vựng.
      </p>
      <WordSetList v-else :word-sets="wordSets" @delete="handleDelete" />
    </template>
  </main>
</template>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
h1 {
  margin: 0;
}
.btn-create {
  background: #16a34a;
  color: white;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}
.error {
  color: #b91c1c;
}
.empty {
  color: #666;
}
</style>
