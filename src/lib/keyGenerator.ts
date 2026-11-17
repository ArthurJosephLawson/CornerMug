const KEY_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ROOM_WORDS = ['COZY', 'MUG', 'BEAN', 'LOFI', 'STUDY', 'Nook'.toUpperCase()];

function randomIndex(max: number): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function randomBlock(length: number): string {
  let block = '';
  for (let index = 0; index < length; index += 1) {
    block += KEY_ALPHABET[randomIndex(KEY_ALPHABET.length)];
  }
  return block;
}

/** Human-readable user key, e.g. MUG-8492-COZY */
export function generateUserKey(): string {
  return `MUG-${randomBlock(4)}-${randomBlock(4)}`;
}

/** Short shareable room key, e.g. CAFE-7X2 */
export function generateRoomKey(): string {
  const word = ROOM_WORDS[randomIndex(ROOM_WORDS.length)];
  return `${word}-${randomBlock(3)}`;
}

/** Compact unique id for chat messages and signals. */
export function generateLocalId(): string {
  return `${Date.now().toString(36)}-${randomBlock(6)}`;
}
