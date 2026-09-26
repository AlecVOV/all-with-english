import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

type WordRecord = Schema['Word']['type'];

// Goes through the WordSet.words relationship resolver, which is a DynamoDB Query
// on the GSI the hasMany already created (gsi-WordSet.words) — it reads only this
// set's words. Avoid Word.list({ filter }) and the SDK lazy loader wordSet.words():
// both compile to a Scan of the whole Word table, costing reads for every word of
// every set and returning partial pages.
const WORDS_OF_SET_QUERY = /* GraphQL */ `
  query WordsOfSet($id: ID!, $limit: Int, $nextToken: String) {
    getWordSet(id: $id) {
      id
      words(limit: $limit, nextToken: $nextToken) {
        items {
          id
          wordSetId
          term
          meaning
          order
          createdAt
          updatedAt
        }
        nextToken
      }
    }
  }
`;

interface WordsOfSetResult {
  getWordSet: {
    words: { items: WordRecord[]; nextToken: string | null } | null;
  } | null;
}

function graphqlErrorMessage(e: any): string {
  return e?.errors?.map((err: { message: string }) => err.message).join(', ') ?? e?.message ?? String(e);
}

/** List every Word of a set, following nextToken (a page is capped by `limit`). */
async function listWordsOfSet(wordSetId: string): Promise<WordRecord[]> {
  const all: WordRecord[] = [];
  let nextToken: string | null = null;
  do {
    let result: { data: WordsOfSetResult };
    try {
      result = (await client.graphql({
        query: WORDS_OF_SET_QUERY,
        variables: { id: wordSetId, limit: 1000, nextToken },
      })) as { data: WordsOfSetResult };
    } catch (e) {
      throw new Error(graphqlErrorMessage(e));
    }
    const page = result.data.getWordSet?.words;
    all.push(...(page?.items ?? []));
    nextToken = page?.nextToken ?? null;
  } while (nextToken);
  return all;
}

async function createWords(wordSetId: string, words: WordInput[]) {
  const results = await Promise.all(
    words.map((w, index) =>
      client.models.Word.create({
        wordSetId,
        term: w.term,
        meaning: w.meaning,
        order: index,
      })
    )
  );
  const failed = results.filter((r) => r.errors || !r.data);
  if (failed.length) {
    const detail = failed.flatMap((r) => r.errors ?? []).map((e) => e.message).join(', ');
    throw new Error(`Không lưu được ${failed.length}/${words.length} từ${detail ? `: ${detail}` : ''}`);
  }
}

export interface WordInput {
  term: string;
  meaning: string;
}

/**
 * CRUD helpers around Amplify Data for WordSet/Word.
 * Every call goes straight to AppSync — no server route, no Lambda,
 * to keep the whole app inside Amplify Hosting + AppSync + DynamoDB free tier.
 */
export function useWordSets() {
  async function createWordSet(title: string, words: WordInput[]) {
    const { data: wordSet, errors: setErrors } = await client.models.WordSet.create({
      title,
      wordCount: words.length,
    });

    if (setErrors || !wordSet) {
      throw new Error(setErrors?.map((e) => e.message).join(', ') ?? 'Không tạo được bài học');
    }

    await createWords(wordSet.id, words);

    return wordSet;
  }

  async function listWordSets() {
    const { data, errors } = await client.models.WordSet.list();
    if (errors) {
      throw new Error(errors.map((e) => e.message).join(', '));
    }
    return data.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }

  async function getWordSetWithWords(wordSetId: string) {
    const { data: wordSet, errors } = await client.models.WordSet.get({ id: wordSetId });
    if (errors || !wordSet) {
      throw new Error(errors?.map((e) => e.message).join(', ') ?? 'Không tìm thấy bài học');
    }

    const words = await listWordsOfSet(wordSetId);

    return {
      wordSet,
      words: words.sort((a, b) => a.order - b.order),
    };
  }

  async function updateWordSet(wordSetId: string, title: string, words: WordInput[]) {
    const { errors: setErrors } = await client.models.WordSet.update({
      id: wordSetId,
      title,
      wordCount: words.length,
    });
    if (setErrors) {
      throw new Error(setErrors.map((e) => e.message).join(', '));
    }

    const existingWords = await listWordsOfSet(wordSetId);

    // Simplest correct way to reconcile add/remove/reorder: replace all words.
    // Lesson word counts are small, and editing is infrequent (unlike gameplay),
    // so this stays well within the "avoid needless writes" guidance for hot paths.
    await Promise.all(existingWords.map((w) => client.models.Word.delete({ id: w.id })));

    await createWords(wordSetId, words);
  }

  async function deleteWordSet(wordSetId: string) {
    const words = await listWordsOfSet(wordSetId);

    await Promise.all(words.map((w) => client.models.Word.delete({ id: w.id })));

    const { errors } = await client.models.WordSet.delete({ id: wordSetId });
    if (errors) {
      throw new Error(errors.map((e) => e.message).join(', '));
    }
  }

  return {
    createWordSet,
    listWordSets,
    getWordSetWithWords,
    updateWordSet,
    deleteWordSet,
  };
}
