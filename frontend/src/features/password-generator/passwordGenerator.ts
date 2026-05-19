export interface PasswordGeneratorOptions {
  length: number;
  useLowercase: boolean;
  useUppercase: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  excludeAmbiguous: boolean;
}

export interface RandomSource {
  getRandomValues: (array: Uint32Array) => Uint32Array;
}

const lowercase = 'abcdefghijklmnopqrstuvwxyz';
const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numbers = '0123456789';
const symbols = '!@#$%^&*()-_=+[]{};:,.?';
const ambiguous = new Set('Il1O0o'.split(''));

export const defaultPasswordGeneratorOptions: PasswordGeneratorOptions = {
  length: 18,
  useLowercase: true,
  useUppercase: true,
  useNumbers: true,
  useSymbols: true,
  excludeAmbiguous: true,
};

function removeAmbiguousCharacters(characters: string) {
  return characters
    .split('')
    .filter((character) => !ambiguous.has(character))
    .join('');
}

function getSelectedCharacterSets(options: PasswordGeneratorOptions) {
  const sets = [
    options.useLowercase ? lowercase : '',
    options.useUppercase ? uppercase : '',
    options.useNumbers ? numbers : '',
    options.useSymbols ? symbols : '',
  ]
    .map((set) => (options.excludeAmbiguous ? removeAmbiguousCharacters(set) : set))
    .filter(Boolean);

  if (sets.length === 0) {
    throw new Error('Select at least one character set.');
  }

  return sets;
}

function getRandomIndex(maxExclusive: number, randomSource: RandomSource) {
  const values = new Uint32Array(1);
  randomSource.getRandomValues(values);
  return values[0] % maxExclusive;
}

function pickCharacter(characters: string, randomSource: RandomSource) {
  return characters[getRandomIndex(characters.length, randomSource)];
}

function shuffleCharacters(characters: string[], randomSource: RandomSource) {
  const nextCharacters = [...characters];

  for (let index = nextCharacters.length - 1; index > 0; index -= 1) {
    const targetIndex = getRandomIndex(index + 1, randomSource);
    [nextCharacters[index], nextCharacters[targetIndex]] = [nextCharacters[targetIndex], nextCharacters[index]];
  }

  return nextCharacters;
}

export function generatePassword(
  options: PasswordGeneratorOptions = defaultPasswordGeneratorOptions,
  randomSource: RandomSource = globalThis.crypto,
) {
  const length = Math.max(6, Math.min(128, Math.floor(options.length)));
  const selectedSets = getSelectedCharacterSets(options);
  const combinedCharacters = selectedSets.join('');
  const passwordCharacters = selectedSets
    .slice(0, Math.min(selectedSets.length, length))
    .map((set) => pickCharacter(set, randomSource));

  while (passwordCharacters.length < length) {
    passwordCharacters.push(pickCharacter(combinedCharacters, randomSource));
  }

  return shuffleCharacters(passwordCharacters, randomSource).join('');
}
