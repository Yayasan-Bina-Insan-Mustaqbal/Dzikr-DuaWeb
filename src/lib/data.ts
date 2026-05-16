import invocationsData from '../data/invocations.json';
import type { Chapter, Invocation } from '../types/data';

const chapters = invocationsData as Array<Chapter>;

export const getChapters = (): Array<Chapter> => {
  return chapters;
};

export const getChapterById = (id: number): Chapter | undefined => {
  return chapters.find((c) => c.id === id);
};

export const getInvocationById = (id: number): Invocation | undefined => {
  for (const chapter of chapters) {
    const invocation = chapter.invocations.find((i) => i.id === id);
    if (invocation) return invocation;
  }
  return undefined;
};

export const searchInvocations = (query: string): Array<Invocation> => {
  const normalizedQuery = query.toLowerCase();
  const results: Array<Invocation> = [];

  for (const chapter of chapters) {
    for (const invocation of chapter.invocations) {
      if (
        invocation.albanian.toLowerCase().includes(normalizedQuery) ||
        invocation.latin.toLowerCase().includes(normalizedQuery) ||
        invocation.arabic.includes(query)
      ) {
        results.push(invocation);
      }
    }
  }

  return results;
};
