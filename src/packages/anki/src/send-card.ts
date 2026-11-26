const API_VERSION = 6;
const DECK_NAME = 'LingoLyrics PoC';

export interface Flashcard {
  term: string;
  translation: string;
  context: string;
}

interface HttpResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export type HttpClient = (
  url: string,
  init: { method: 'POST'; headers: { 'Content-Type': string }; body: string },
) => Promise<HttpResponse>;

interface AnkiResponse {
  result: unknown;
  error: string | null;
}

function isAnkiResponse(value: unknown): value is AnkiResponse {
  if (typeof value !== 'object' || value === null) return false;
  const response = value as Partial<AnkiResponse>;
  return 'result' in response && (response.error === null || typeof response.error === 'string');
}

async function invoke(
  endpoint: string,
  action: string,
  params: Record<string, unknown>,
  http: HttpClient,
): Promise<unknown> {
  const response = await http(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: API_VERSION, params }),
  });
  if (!response.ok) throw new Error(`AnkiConnect returned HTTP ${response.status}`);

  const payload: unknown = await response.json();
  if (!isAnkiResponse(payload)) throw new Error('AnkiConnect returned an invalid response');
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

/** Creates the PoC deck if needed, then adds one Basic note through AnkiConnect. */
export async function sendCardToAnki(
  endpoint: string,
  card: Flashcard,
  http: HttpClient = fetch,
): Promise<number> {
  const url = endpoint.trim();
  if (!url) throw new Error('Enter the AnkiConnect URL shown in the setup guide');
  if (!card.term.trim() || !card.translation.trim() || !card.context.trim()) {
    throw new Error('Term, translation, and context are required');
  }

  await invoke(url, 'createDeck', { deck: DECK_NAME }, http);
  const noteId = await invoke(
    url,
    'addNote',
    {
      note: {
        deckName: DECK_NAME,
        modelName: 'Basic',
        fields: {
          Front: card.term.trim(),
          Back: `${card.translation.trim()}\n\n${card.context.trim()}`,
        },
        options: { allowDuplicate: false },
        tags: ['lingolyrics', 'poc-r3'],
      },
    },
    http,
  );

  if (typeof noteId !== 'number') throw new Error('AnkiConnect did not return a note ID');
  return noteId;
}
