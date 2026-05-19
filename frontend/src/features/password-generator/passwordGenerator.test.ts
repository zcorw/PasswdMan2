import { describe, expect, it } from 'vitest';

import { generatePassword, type PasswordGeneratorOptions, type RandomSource } from './passwordGenerator';

const baseOptions: PasswordGeneratorOptions = {
  length: 16,
  useLowercase: true,
  useUppercase: true,
  useNumbers: true,
  useSymbols: true,
  excludeAmbiguous: true,
};

function createRandomSource(values: number[]): RandomSource {
  let index = 0;

  return {
    getRandomValues(array: Uint32Array) {
      array[0] = values[index % values.length];
      index += 1;
      return array;
    },
  };
}

describe('password generator', () => {
  it('generates a password with the requested length', () => {
    const password = generatePassword(baseOptions, createRandomSource([1, 2, 3, 4, 5]));

    expect(password).toHaveLength(16);
  });

  it('allows six character passwords', () => {
    const password = generatePassword({ ...baseOptions, length: 6 }, createRandomSource([1, 2, 3, 4, 5]));

    expect(password).toHaveLength(6);
  });

  it('honors selected character sets', () => {
    const password = generatePassword(
      {
        ...baseOptions,
        length: 10,
        useUppercase: false,
        useNumbers: false,
        useSymbols: false,
        excludeAmbiguous: false,
      },
      createRandomSource([0, 1, 2, 3, 4]),
    );

    expect(password).toMatch(/^[a-z]+$/);
  });

  it('excludes ambiguous characters when requested', () => {
    const password = generatePassword(
      {
        ...baseOptions,
        length: 24,
        useSymbols: false,
        excludeAmbiguous: true,
      },
      createRandomSource([0, 1, 2, 3, 4, 5, 6]),
    );

    expect(password).not.toMatch(/[Il1O0o]/);
  });

  it('requires at least one selected character set', () => {
    expect(() =>
      generatePassword(
        {
          ...baseOptions,
          useLowercase: false,
          useUppercase: false,
          useNumbers: false,
          useSymbols: false,
        },
        createRandomSource([0]),
      ),
    ).toThrow('Select at least one character set.');
  });
});
