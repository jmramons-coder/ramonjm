/**
 * Registre minimal des prompts qui peuvent changer une décision produit.
 * Une version identifie le contrat de jugement injecté à un fournisseur ; elle
 * n'est pas une version de modèle.
 */
export const PROMPT_VERSIONS = {
  triggerScan: "trigger-scan-v1",
  jevPilot: "jev-pilot-v1",
  vigie: "vigie-v1",
  sttContext: "stt-context-v2",
} as const;
