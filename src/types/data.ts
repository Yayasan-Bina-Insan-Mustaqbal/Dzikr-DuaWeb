export interface Invocation {
  id: number;
  audio: string;
  arabic: string;
  latin: string;
  albanian: string;
  reference: string;
  name?: string;
  english?: string;
  chapter_name?: string; // Cache for easy display
  chapter_name_en?: string; // Cache for easy display
}

export interface Chapter {
  id: number;
  chapter_name: string;
  chapter_name_en?: string;
  invocations: Invocation[];
}
