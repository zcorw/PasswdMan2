const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createRecoveryCode(randomSource: Crypto = crypto) {
  const bytes = randomSource.getRandomValues(new Uint8Array(20));
  const characters = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]);

  return [
    characters.slice(0, 5).join(''),
    characters.slice(5, 10).join(''),
    characters.slice(10, 15).join(''),
    characters.slice(15, 20).join(''),
  ].join('-');
}
