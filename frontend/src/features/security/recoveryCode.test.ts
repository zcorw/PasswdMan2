import { describe, expect, it } from 'vitest';

import { createRecoveryCode } from './recoveryCode';

function createRandomSource(): Crypto {
  return {
    getRandomValues(array: Uint8Array) {
      array.forEach((_, index) => {
        array[index] = index;
      });
      return array;
    },
  } as Crypto;
}

describe('recovery code', () => {
  it('creates grouped recovery codes without ambiguous characters', () => {
    const recoveryCode = createRecoveryCode(createRandomSource());

    expect(recoveryCode).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}-[A-Z2-9]{5}-[A-Z2-9]{5}$/);
    expect(recoveryCode).not.toMatch(/[IO01]/);
  });
});
