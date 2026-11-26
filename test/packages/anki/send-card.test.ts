import { sendCardToAnki, type Flashcard, type HttpClient } from '@lingolyrics/anki';

const card: Flashcard = {
  term: '今日',
  translation: 'today',
  context: '今日は雨が降っている',
};

describe('sendCardToAnki', () => {
  it('creates the PoC deck and adds a complete note', async () => {
    const requests: unknown[] = [];
    const http: HttpClient = async (_url, init) => {
      const request = JSON.parse(init.body) as { action: string };
      requests.push(request);
      return {
        ok: true,
        status: 200,
        json: async () => ({ result: request.action === 'addNote' ? 12345 : 1, error: null }),
      };
    };

    await expect(sendCardToAnki('http://192.168.1.2:8765', card, http)).resolves.toBe(12345);
    expect(requests).toEqual([
      { action: 'createDeck', version: 6, params: { deck: 'LingoLyrics PoC' } },
      {
        action: 'addNote',
        version: 6,
        params: {
          note: {
            deckName: 'LingoLyrics PoC',
            modelName: 'Basic',
            fields: { Front: '今日', Back: 'today\n\n今日は雨が降っている' },
            options: { allowDuplicate: false },
            tags: ['lingolyrics', 'poc-r3'],
          },
        },
      },
    ]);
  });

  it('surfaces AnkiConnect errors', async () => {
    const http: HttpClient = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ result: null, error: 'collection is not available' }),
    });

    await expect(sendCardToAnki('http://anki:8765', card, http)).rejects.toThrow(
      'collection is not available',
    );
  });

  it('rejects an incomplete card before making a request', async () => {
    let requested = false;
    const http: HttpClient = async () => {
      requested = true;
      throw new Error('request should not run');
    };
    await expect(
      sendCardToAnki('http://anki:8765', { ...card, translation: '' }, http),
    ).rejects.toThrow('Term, translation, and context are required');
    expect(requested).toBe(false);
  });
});
