import { describe, expect, it } from 'vitest';

import { notificationReducer } from './notificationStore';

describe('notificationStore', () => {
  it('stores the current notification with an incrementing id', () => {
    const firstState = notificationReducer({ current: null, nextId: 1 }, {
      message: 'Saved.',
      severity: 'success',
      type: 'notify',
    });
    const secondState = notificationReducer(firstState, {
      message: 'Failed.',
      severity: 'error',
      type: 'notify',
    });

    expect(firstState.current).toEqual({ id: 1, message: 'Saved.', severity: 'success' });
    expect(secondState.current).toEqual({ id: 2, message: 'Failed.', severity: 'error' });
  });

  it('clears the current notification', () => {
    expect(
      notificationReducer(
        { current: { id: 1, message: 'Saved.', severity: 'success' }, nextId: 2 },
        { type: 'clear' },
      ),
    ).toEqual({ current: null, nextId: 2 });
  });
});

