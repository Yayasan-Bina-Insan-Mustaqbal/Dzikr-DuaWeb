import { create, insertMultiple, search as oramaSearch, AnyOrama } from '@orama/orama';
import { getChapters } from './data';
import { Invocation } from '../types/data';

let oramaDb: AnyOrama | null = null;

// Initialize Orama search index locally
export const initSearchIndex = async () => {
  if (oramaDb) return oramaDb;

  oramaDb = await create({
    schema: {
      id: 'number',
      chapter_name: 'string',
      arabic: 'string',
      latin: 'string',
      albanian: 'string',
    },
  });

  const chapters = getChapters();
  const documents = [];

  for (const chapter of chapters) {
    for (const inv of chapter.invocations) {
      documents.push({
        id: inv.id,
        chapter_name: chapter.chapter_name,
        arabic: inv.arabic,
        latin: inv.latin,
        albanian: inv.albanian,
      });
    }
  }

  await insertMultiple(oramaDb, documents);
  return oramaDb;
};

// Search function
export const searchDhikr = async (term: string): Promise<Invocation[]> => {
  const db = await initSearchIndex();
  
  const results = await oramaSearch(db, {
    term,
    properties: ['albanian', 'latin', 'arabic', 'chapter_name'],
    tolerance: 1, // typo tolerance
    limit: 20,
  });

  // Re-hydrate invocations from the DB IDs
  const chapters = getChapters();
  const matchedInvocations: Invocation[] = [];
  
  for (const hit of results.hits) {
    const hitId = hit.document.id as number;
    for (const chapter of chapters) {
      const inv = chapter.invocations.find((i) => i.id === hitId);
      if (inv) {
        matchedInvocations.push(inv);
        break; // Found it
      }
    }
  }

  return matchedInvocations;
};
