<script setup lang="ts">
import { ref, computed } from 'vue';
import type { WordInput } from '../composables/useWordSets';

const props = withDefaults(
  defineProps<{
    initialTitle?: string;
    initialWords?: WordInput[];
    submitLabel?: string;
  }>(),
  {
    initialTitle: '',
    initialWords: () => [],
    submitLabel: 'Lưu bài học',
  }
);

const emit = defineEmits<{
  submit: [title: string, words: WordInput[]];
}>();

const title = ref(props.initialTitle);
const bulkText = ref(
  props.initialWords.map((w) => `${w.term} - ${w.meaning}`).join('\n')
);
const manualWords = ref<WordInput[]>(
  props.initialWords.length ? props.initialWords.map((w) => ({ ...w })) : [{ term: '', meaning: '' }]
);
const mode = ref<'bulk' | 'manual'>('bulk');
const error = ref('');
const submitting = ref(false);

// Only treat "-"/"|" as the term/meaning separator when it has whitespace on
// both sides ("term - meaning"), so a hyphenated word like "hand-craft" (no
// surrounding spaces) stays intact instead of being split mid-word. Splits at
// just the first such separator so the meaning can itself contain " - ".
const SEPARATOR = /\s+[-|]\s+/;

function parseBulkText(text: string): WordInput[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(SEPARATOR);
      if (!match || match.index === undefined) {
        return { term: line, meaning: '' };
      }
      const term = line.slice(0, match.index).trim();
      const meaning = line.slice(match.index + match[0].length).trim();
      return { term, meaning };
    });
}

const bulkPreview = computed(() => parseBulkText(bulkText.value));

function addManualRow() {
  manualWords.value.push({ term: '', meaning: '' });
}

function removeManualRow(index: number) {
  manualWords.value.splice(index, 1);
}

function validate(words: WordInput[]): string | null {
  if (!title.value.trim()) return 'Vui lòng nhập tên bài học';
  const cleaned = words.filter((w) => w.term.trim());
  if (cleaned.length === 0) return 'Vui lòng nhập ít nhất 1 từ vựng';
  for (const w of cleaned) {
    if (!w.meaning.trim()) return `Từ "${w.term}" chưa có nghĩa`;
  }
  const terms = cleaned.map((w) => w.term.trim().toLowerCase());
  const dup = terms.find((t, i) => terms.indexOf(t) !== i);
  if (dup) return `Từ "${dup}" bị trùng trong bài`;
  return null;
}

function handleSubmit() {
  error.value = '';
  const words = (mode.value === 'bulk' ? bulkPreview.value : manualWords.value).map((w) => ({
    term: w.term.trim(),
    meaning: w.meaning.trim(),
  }));

  const validationError = validate(words);
  if (validationError) {
    error.value = validationError;
    return;
  }

  submitting.value = true;
  emit('submit', title.value.trim(), words.filter((w) => w.term));
}

defineExpose({ setSubmitting: (v: boolean) => (submitting.value = v), setError: (msg: string) => (error.value = msg) });
</script>

<template>
  <form class="word-set-form" @submit.prevent="handleSubmit">
    <label class="field">
      <span>Tên bài học</span>
      <input v-model="title" type="text" placeholder="Ví dụ: Unit 1 - Family" required />
    </label>

    <div class="mode-tabs">
      <button type="button" :class="{ active: mode === 'bulk' }" @click="mode = 'bulk'">
        Nhập nhanh
      </button>
      <button type="button" :class="{ active: mode === 'manual' }" @click="mode = 'manual'">
        Nhập từng cặp
      </button>
    </div>

    <div v-if="mode === 'bulk'" class="bulk-mode">
      <label class="field">
        <span>Mỗi dòng 1 từ, dạng "từ - nghĩa" hoặc "từ | nghĩa"</span>
        <textarea
          v-model="bulkText"
          rows="8"
          placeholder="apple - quả táo&#10;banana - quả chuối"
        />
      </label>
      <p class="hint">Xem trước: {{ bulkPreview.filter(w => w.term).length }} từ</p>
    </div>

    <div v-else class="manual-mode">
      <div v-for="(w, i) in manualWords" :key="i" class="manual-row">
        <input v-model="w.term" type="text" placeholder="Từ" />
        <input v-model="w.meaning" type="text" placeholder="Nghĩa" />
        <button type="button" class="remove-btn" @click="removeManualRow(i)">✕</button>
      </div>
      <button type="button" class="add-btn" @click="addManualRow">+ Thêm dòng</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <button type="submit" class="submit-btn" :disabled="submitting">
      {{ submitting ? 'Đang lưu...' : submitLabel }}
    </button>
  </form>
</template>

<style scoped>
.word-set-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 560px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field span {
  font-weight: 600;
  font-size: 0.9rem;
}
input,
textarea {
  padding: 0.6rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
}
.mode-tabs {
  display: flex;
  gap: 0.5rem;
}
.mode-tabs button {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
}
.mode-tabs button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}
.hint {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}
.manual-mode {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.manual-row {
  display: flex;
  gap: 0.5rem;
}
.manual-row input {
  flex: 1;
}
.remove-btn {
  border: none;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 8px;
  width: 2.5rem;
  cursor: pointer;
}
.add-btn {
  align-self: flex-start;
  border: 1px dashed #999;
  background: none;
  border-radius: 8px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
}
.error {
  color: #b91c1c;
  font-size: 0.9rem;
  margin: 0;
}
.submit-btn {
  padding: 0.7rem 1rem;
  border: none;
  border-radius: 8px;
  background: #16a34a;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
