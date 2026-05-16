export interface AudioVersion {
  src: string;
  startTime?: number;
  endTime?: number;
}

export interface Invocation {
  id: number;
  audio: string;
  arabic: string;
  latin: string;
  albanian: string;
  indonesian?: string;
  reference: string;
  name?: string;
  english?: string;
  chapter_name?: string; // Cache for easy display
  chapter_name_en?: string; // Cache for easy display
  queueId?: string; // For tracking unique instances in the queue
  audio_versions?: Record<string, string | AudioVersion>; // Multiple reciter versions
}

export interface Chapter {
  id: number;
  chapter_name: string;
  chapter_name_en?: string;
  invocations: Array<Invocation>;
}
