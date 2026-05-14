export interface Invocation {
  id: number;
  audio: string;
  arabic: string;
  latin: string;
  albanian: string;
  reference: string;
}

export interface Chapter {
  id: number;
  chapter_name: string;
  invocations: Invocation[];
}
