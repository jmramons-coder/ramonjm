/**
 * Jev pilot: classify names already found by the generative trigger scan.
 * Jev never extracts a new name or changes dates, travellers, or constraints.
 */
import type { TranscriptLine } from "../transcription/types.ts";
import { PROMPT_VERSIONS } from "../ai/prompt-registry.ts";
import type { DestinationDite, IntentionDestination, LiveTriggers } from "./live-brief.ts";

export const JEV_MODEL = "jev-1.13.0";
export const JEV_GATEWAY_MODEL = "typesafe-ai/jev";
export const JEV_DIRECT_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
export const JEV_GATEWAY_ENDPOINT = "https://ai-gateway.vercel.sh/typesafe/v1/systemone";
export const JEV_TIMEOUT_MS = 500;
export const JEV_DECISION_THRESHOLD = 0.9;
export const JEV_PILOT_VERSION = PROMPT_VERSIONS.jevPilot;

export type PilotMode = "baseline" | "jev_shadow" | "jev_lab" | "jev_live";
/** Normal consultations use Jev; explicit comparison arms stay in the lab. */
export function jevModeForConversation(requested: unknown, labMode: boolean): PilotMode {
  if (!labMode) return "jev_live";
  return requested === "jev_shadow" || requested === "jev_lab" ? requested : "baseline";
}

export type PilotStatus = "baseline" | "skipped" | "unavailable" | "timeout" | "error" | "shadow" | "applied";
export type JevTransport = "gateway" | "connect" | "direct";
export type PilotMeta = {
  mode: PilotMode;
  status: PilotStatus;
  model: string | null;
  transport: JevTransport | null;
  version: string;
  baselineMs: number;
  jevMs: number | null;
  candidateCount: number;
  disagreements: number;
  corrections: number;
};

type ChoiceAnswer = { type: "choice"; choice: string; probabilities: Record<string, number> };
type NoulAnswer = { type: "noul"; noul: number };
type JevAnswer = ChoiceAnswer | NoulAnswer;
type JevResponse = { model: string; answers: Record<string, JevAnswer> };
type Candidate = { nom: string; baseline: IntentionDestination };

function key(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function destinationCandidates(triggers: LiveTriggers): Candidate[] {
  const listed = triggers.destinations_dites ?? [];
  const candidates = new Map<string, Candidate>();
  for (const item of listed) {
    const normalized = key(item.nom);
    if (normalized && !candidates.has(normalized)) candidates.set(normalized, { nom: item.nom, baseline: item.intention });
  }
  for (const nom of triggers.destinations) {
    const normalized = key(nom);
    if (normalized && !candidates.has(normalized)) candidates.set(normalized, { nom, baseline: "souhaitee" });
  }
  // Le scan peut fournir 8 mentions détaillées et 5 destinations cherchables.
  // Garder l'union entière : tronquer ici pourrait perdre un lieu voulu.
  return [...candidates.values()];
}

export function buildJevRequest(lines: TranscriptLine[], triggers: LiveTriggers, model = JEV_MODEL) {
  const candidates = destinationCandidates(triggers);
  const state = {
    transcript: lines.map((line) => ({ speaker: line.speaker, text: line.text })),
    candidates: {
      destinations: candidates.map((candidate) => candidate.nom),
      hotel: triggers.hotel,
    },
  };
  const questions: Record<string, unknown> = {};
  for (let i = 0; i < candidates.length; i += 1) {
    questions[`destination_${i}`] = {
      type: "choice",
      instructions: `Classify the client's CURRENT travel intent toward the exact place in \`candidates.destinations[${i}]\`, using only \`transcript\`. A destination merely mentioned by the advisor is not automatically wanted by the client. The conversation may be informal Quebec French or an unfinished speech transcript.`,
      criteria: {
        souhaitee: "The client currently wants or explicitly considers travelling there, including an open choice between several places.",
        evoquee: "The place is only recalled, compared, mentioned by someone else, or described as past travel without a current wish to go there.",
        rejetee: "The client explicitly rules it out or replaces it with another destination, including phrases like 'pas la Floride' or 'plutôt les Caraïbes'.",
        absente: "This place was not actually said in the transcript; it is an extraction error.",
      },
    };
  }
  if (triggers.hotel) {
    questions.hotel_named = {
      type: "noul",
      instructions: "Does `candidates.hotel` refer to a hotel, resort, or hotel chain NAME actually spoken in `transcript`, even if incomplete or misspelled by speech recognition? A category such as 'un 4 étoiles' or 'un tout-inclus' is not a name.",
      criteria: { true: "An actual named property or chain is spoken.", false: "Only a category, generic description, or invented name is present." },
    };
    questions.hotel_name_uncertain = {
      type: "noul",
      instructions: "Does the speaker explicitly show uncertainty about the NAME of `candidates.hotel` in `transcript` (forgotten, approximate, or searching for its name)? Uncertainty about price, dates, or whether to travel does not count.",
      criteria: { true: "The property's name itself is uncertain.", false: "The name is stated without name uncertainty, even if the trip decision is uncertain." },
    };
  }
  return { candidates, body: { state, model, questions } };
}

function validProbability(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function choice(answer: JevAnswer | undefined): { value: IntentionDestination | "absente"; probability: number } | null {
  if (!answer || answer.type !== "choice") return null;
  const keys = ["souhaitee", "evoquee", "rejetee", "absente"];
  if (!keys.includes(answer.choice) || !answer.probabilities || typeof answer.probabilities !== "object") return null;
  const values = keys.map((key) => answer.probabilities[key]);
  if (!values.every(validProbability) || Math.abs(values.reduce((sum, value) => sum + value, 0) - 1) > 0.02) return null;
  const probability = answer.probabilities[answer.choice];
  if (probability < Math.max(...values)) return null;
  return { value: answer.choice as IntentionDestination | "absente", probability };
}

function noul(answer: JevAnswer | undefined): number | null {
  return answer?.type === "noul" && validProbability(answer.noul) ? answer.noul : null;
}

export function applyJevDecisions(triggers: LiveTriggers, response: JevResponse) {
  const candidates = destinationCandidates(triggers);
  const classified: DestinationDite[] = [];
  let disagreements = 0;
  let corrections = 0;
  let destinationCorrections = 0;
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    const decided = choice(response.answers[`destination_${i}`]);
    if (!decided) throw new Error(`Invalid Jev destination_${i} answer`);
    if (decided.value !== candidate.baseline) disagreements += 1;
    const intention = decided.probability >= JEV_DECISION_THRESHOLD ? decided.value : candidate.baseline;
    if (intention !== candidate.baseline) {
      corrections += 1;
      destinationCorrections += 1;
    }
    if (intention !== "absente") classified.push({ nom: candidate.nom, intention });
  }
  let hotel = triggers.hotel;
  let hotelNomIncertain = triggers.hotel_nom_incertain;
  if (hotel) {
    const named = noul(response.answers.hotel_named);
    const uncertain = noul(response.answers.hotel_name_uncertain);
    if (named === null || uncertain === null) throw new Error("Invalid Jev hotel answers");
    if (named < 0.5) disagreements += 1;
    if (1 - named >= JEV_DECISION_THRESHOLD) {
      hotel = null;
      hotelNomIncertain = false;
      corrections += 1;
    } else if (named >= JEV_DECISION_THRESHOLD) {
      const nextUncertain = uncertain >= JEV_DECISION_THRESHOLD ? true
        : 1 - uncertain >= JEV_DECISION_THRESHOLD ? false : hotelNomIncertain;
      if ((uncertain >= 0.5) !== hotelNomIncertain) disagreements += 1;
      if (nextUncertain !== hotelNomIncertain) corrections += 1;
      hotelNomIncertain = nextUncertain;
    }
  }
  const classifiedByKey = new Map(classified.map((item) => [key(item.nom), item.intention]));
  const previouslyWished = triggers.destinations.filter((nom) => classifiedByKey.get(key(nom)) === "souhaitee");
  const alreadyWished = new Set(previouslyWished.map(key));
  const newlyWished = classified.filter((item) => item.intention === "souhaitee" && !alreadyWished.has(key(item.nom))).map((item) => item.nom);
  const destinations = destinationCorrections > 0 ? [...previouslyWished, ...newlyWished].slice(0, 5) : triggers.destinations;
  return {
    triggers: {
      ...triggers,
      destinations,
      destinations_dites: destinationCorrections > 0 ? classified : triggers.destinations_dites,
      hotel,
      hotel_nom_incertain: hotelNomIncertain,
    },
    disagreements,
    corrections,
  };
}

export async function evaluateJev(
  lines: TranscriptLine[],
  triggers: LiveTriggers,
  access: { endpoint: string; model: string; token: string | (() => Promise<string>) },
  options: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
) {
  const { candidates, body } = buildJevRequest(lines, triggers, access.model);
  if (candidates.length === 0 && !triggers.hotel) return null;
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new DOMException("Jev deadline exceeded", "AbortError"));
    }, options.timeoutMs ?? JEV_TIMEOUT_MS);
  });
  try {
    const apiKey = await Promise.race([typeof access.token === "string" ? Promise.resolve(access.token) : access.token(), deadline]);
    if (!apiKey) throw new Error("Jev credential unavailable");
    const response = await Promise.race([(options.fetchImpl ?? fetch)(access.endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    }), deadline]);
    if (!response.ok) throw new Error(`Jev HTTP ${response.status}`);
    const data = await Promise.race([response.json(), deadline]) as JevResponse;
    if (!data || data.model !== access.model || !data.answers || typeof data.answers !== "object" || Array.isArray(data.answers)) {
      throw new Error("Invalid Jev response");
    }
    return { ...applyJevDecisions(triggers, data), model: data.model, candidateCount: candidates.length + (triggers.hotel ? 1 : 0) };
  } finally {
    clearTimeout(timeout);
  }
}

/** One entry point for the route and the offline benchmark, including fallback. */
export async function runJevPilot(
  lines: TranscriptLine[],
  baseline: LiveTriggers,
  options: {
    requestedMode: PilotMode;
    labMode: boolean;
    enabled: boolean;
    apiKey?: string;
    gatewayToken?: string;
    connectToken?: () => Promise<string>;
    baselineMs: number;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
  },
): Promise<{ triggers: LiveTriggers; pilot: PilotMeta }> {
  const mode = options.enabled && (options.labMode || options.requestedMode === "jev_live") ? options.requestedMode : "baseline";
  const candidateCount = destinationCandidates(baseline).length + (baseline.hotel ? 1 : 0);
  const pilot: PilotMeta = {
    mode, status: "baseline", model: null, transport: null, version: JEV_PILOT_VERSION,
    baselineMs: options.baselineMs, jevMs: null, candidateCount, disagreements: 0, corrections: 0,
  };
  if (mode === "baseline") {
    if (options.requestedMode !== "baseline") pilot.status = "unavailable";
    return { triggers: baseline, pilot };
  }
  if (candidateCount === 0) return { triggers: baseline, pilot: { ...pilot, status: "skipped" } };
  const access = options.gatewayToken
    ? { endpoint: JEV_GATEWAY_ENDPOINT, model: JEV_GATEWAY_MODEL, token: options.gatewayToken, transport: "gateway" as const }
    : options.connectToken
      ? { endpoint: JEV_DIRECT_ENDPOINT, model: JEV_MODEL, token: options.connectToken, transport: "connect" as const }
      : options.apiKey
        ? { endpoint: JEV_DIRECT_ENDPOINT, model: JEV_MODEL, token: options.apiKey, transport: "direct" as const }
        : null;
  if (!access) return { triggers: baseline, pilot: { ...pilot, status: "unavailable" } };
  pilot.transport = access.transport;
  const startedAt = performance.now();
  try {
    const result = await evaluateJev(lines, baseline, access, options);
    pilot.jevMs = Math.round(performance.now() - startedAt);
    pilot.model = result?.model ?? access.model;
    pilot.disagreements = result?.disagreements ?? 0;
    pilot.corrections = result?.corrections ?? 0;
    pilot.status = mode === "jev_shadow" ? "shadow" : "applied";
    return { triggers: (mode === "jev_lab" || mode === "jev_live") && result ? result.triggers : baseline, pilot };
  } catch (error) {
    pilot.jevMs = Math.round(performance.now() - startedAt);
    pilot.status = error instanceof Error && error.name === "AbortError" ? "timeout" : "error";
    return { triggers: baseline, pilot };
  }
}
