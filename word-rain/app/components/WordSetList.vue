<script setup lang="ts">
defineProps<{
  wordSets: Array<{
    id: string;
    title: string;
    wordCount?: number | null;
    createdAt?: string | null;
  }>;
}>();

const emit = defineEmits<{
  delete: [id: string];
}>();
</script>

<template>
  <ul class="word-set-list">
    <li v-for="ws in wordSets" :key="ws.id" class="word-set-card">
      <div class="info">
        <h3>{{ ws.title }}</h3>
        <p class="meta">
          {{ ws.wordCount ?? 0 }} từ
          <span v-if="ws.createdAt"> · {{ new Date(ws.createdAt).toLocaleDateString('vi-VN') }}</span>
        </p>
      </div>
      <div class="actions">
        <NuxtLink :to="`/play/${ws.id}`" class="btn play">Chơi</NuxtLink>
        <NuxtLink :to="`/edit/${ws.id}`" class="btn edit">Sửa</NuxtLink>
        <NuxtLink :to="`/review/${ws.id}`" class="btn review">Ôn flashcard</NuxtLink>
        <button class="btn delete" @click="emit('delete', ws.id)">Xoá</button>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.word-set-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.word-set-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  flex-wrap: wrap;
}
.info h3 {
  margin: 0 0 0.25rem;
}
.meta {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}
.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.btn {
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  font-size: 0.9rem;
  text-decoration: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}
.btn.play {
  background: #3b82f6;
  color: white;
}
.btn.edit {
  background: #e5e7eb;
  color: #111;
}
.btn.review {
  background: #f59e0b;
  color: white;
}
.btn.delete {
  background: #fee2e2;
  color: #b91c1c;
}
</style>
