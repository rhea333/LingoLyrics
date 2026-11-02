export interface CardDraft {
  term: string;
  reading: string;
  translation: string;
  context: string;
}

interface AnkiResponse<T> {
  result: T;
  error: string | null;
}

async function invoke<T>(endpoint: string, action: string, params: Record<string, unknown>) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6, params }),
  });
  if (!response.ok) throw new Error(`AnkiConnect returned HTTP ${response.status}`);
  const payload = (await response.json()) as AnkiResponse<T>;
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

export async function sendCardToAnki(endpoint: string, card: CardDraft): Promise<number> {
  if (!endpoint.trim()) throw new Error('Enter the desktop computer\'s AnkiConnect URL.');
  if (!card.term.trim() || !card.translation.trim()) {
    throw new Error('Term and translation are required.');
  }

  await invoke<number>(endpoint, 'createDeck', { deck: 'LingoLyrics PoC' });
  return invoke<number>(endpoint, 'addNote', {
    note: {
      deckName: 'LingoLyrics PoC',
      modelName: 'Basic',
      fields: {
        Front: `${card.term}<br><small>${card.reading}</small>`,
        Back: `${card.translation}<br><br>${card.context}`,
      },
      options: { allowDuplicate: true },
      tags: ['lingolyrics', 'poc-r3'],
    },
  });
}

function tsvCell(value: string): string {
  return value.replace(/[\t\r\n]+/g, ' ').trim();
}

export function cardAsTsv(card: CardDraft): string {
  return `${tsvCell(`${card.term} (${card.reading})`)}\t${tsvCell(`${card.translation} — ${card.context}`)}\tlingolyrics poc-r3\n`;
}
