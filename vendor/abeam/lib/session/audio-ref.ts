const SESSION_AUDIO_EXTENSIONS = ["webm", "m4a", "mp3", "ogg", "wav"] as const;

/**
 * Les fichiers audio sont écrits par l'application sous
 * `${ownerId}/${sessionId}.${extension}`. Une garde au seul niveau ownerId
 * permettrait de réutiliser l'audio d'une autre rencontre du même compte.
 */
export function isSessionAudioRef(audioRef: string, ownerId: string, sessionId: string): boolean {
  const prefix = `${ownerId}/${sessionId}.`;
  return SESSION_AUDIO_EXTENSIONS.some((extension) => audioRef === `${prefix}${extension}`);
}
