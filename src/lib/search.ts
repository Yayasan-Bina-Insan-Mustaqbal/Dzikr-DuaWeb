import { create, insertMultiple, search as oramaSearch } from '@orama/orama';
import { getChapters } from './data';
import type { Chapter, Invocation } from '../types/data';

let oramaDb: any = null;

export interface SearchResults {
  chapters: Array<Chapter>;
  invocations: Array<Invocation>;
}

// Initialize Orama search index locally
export const initSearchIndex = async () => {
  if (oramaDb) return oramaDb;

  oramaDb = await create({
    schema: {
      type: 'string', // 'chapter' or 'invocation'
      id: 'number',
      invocation_id: 'number',
      chapter_id: 'number',
      chapter_name: 'string',
      arabic: 'string',
      latin: 'string',
      albanian: 'string',
      name: 'string',
      english: 'string',
    },
  });

  const chapters = getChapters();
  const documents = [];

  for (const chapter of chapters) {
    // Add chapter document
    documents.push({
      type: 'chapter',
      chapter_id: chapter.id,
      chapter_name: chapter.chapter_name,
      arabic: '',
      latin: '',
      albanian: '',
      name: '',
      english: '',
    });

    for (const inv of chapter.invocations) {
      // Add invocation document
      documents.push({
        type: 'invocation',
        invocation_id: inv.id,
        chapter_id: chapter.id,
        chapter_name: chapter.chapter_name,
        arabic: inv.arabic,
        latin: inv.latin,
        albanian: inv.albanian,
        name: inv.name || '',
        english: inv.english || '',
      });
    }
  }

  await insertMultiple(oramaDb, documents);
  return oramaDb;
};

// Search function
export const searchDhikr = async (term: string): Promise<SearchResults> => {
  const db = await initSearchIndex();
  
  const results = await oramaSearch(db, {
    term,
    properties: [
      'albanian', 'latin', 'arabic', 'chapter_name', 'name', 'english'
    ],
    tolerance: 1,
    limit: 30,
  });

  const chapters = getChapters();
  const matchedInvocations: Array<Invocation> = [];
  const matchedChapters: Array<Chapter> = [];
  const seenChapters = new Set<number>();
  const seenInvocations = new Set<number>();
  
  for (const hit of results.hits) {
    const doc = hit.document;
    
    if (doc.type === 'chapter') {
      const chapter = chapters.find(c => c.id === doc.chapter_id);
      if (chapter && !seenChapters.has(chapter.id)) {
        matchedChapters.push(chapter);
        seenChapters.add(chapter.id);
      }
    } else {
      const chapter = chapters.find(c => c.id === doc.chapter_id);
      if (chapter) {
        const inv = chapter.invocations.find(i => i.id === doc.invocation_id);
        if (inv && !seenInvocations.has(inv.id)) {
          matchedInvocations.push({
            ...inv,
            chapter_name: chapter.chapter_name,
          });
          seenInvocations.add(inv.id);
        }
      }
    }
  }

  return {
    chapters: matchedChapters,
    invocations: matchedInvocations
  };
};
