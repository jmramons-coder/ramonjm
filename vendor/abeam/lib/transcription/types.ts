export type TranscriptSpeaker = "Advisor" | "Client" | "Conversation";

export type TranscriptLine = {
  id: string;
  speaker: TranscriptSpeaker;
  text: string;
  /** Seconde arrondie, pour l'affichage (contrat historique, inchangé). */
  time: number;
  /**
   * Bornes exactes du tour de parole en millisecondes, telles que fournies par le
   * moteur STT (`utterance.start` / `utterance.end` chez AssemblyAI).
   * OPTIONNELLES : les transcripts saisis à la main ou déjà stockés n'en ont pas —
   * l'ancrage retombe alors sur `time * 1000`. Ce sont ces bornes qui permettent de
   * *dériver* l'ancre temporelle d'un champ du brief (voir `lib/extraction/anchor.ts`).
   */
  startMs?: number;
  endMs?: number;
  kind?: "speech" | "private-note";
};

export type SttAdapter = {
  transcribe(input: {
    audioUrl: string;
    /** Code ISO 639-1 (ex. "fr"). Omis => détection/code-switching natif du moteur. */
    language?: string;
    diarize: boolean;
  }): Promise<{ lines: TranscriptLine[] }>;
};
