// The Week 3 demo paths, over the real committed fixture.

import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../../src/App';
import { AppProvider } from '../../src/state/context';

function setup() {
  render(
    <AppProvider>
      <App />
    </AppProvider>
  );
}

function pick(text: string) {
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

function skipRestAndSearch() {
  let skip = screen.queryByRole('button', { name: /^skip —/i });
  while (skip) {
    fireEvent.click(skip);
    skip = screen.queryByRole('button', { name: /^skip —/i });
  }
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.click(screen.getByRole('button', { name: 'Search parts' }));
}

function rowOrder(): string[] {
  return Array.from(document.querySelectorAll('.row-result .gpn-btn')).map(
    (b) => b.textContent ?? ''
  );
}

describe('volume demo', () => {
  it('happy path ranks the high runner first and marks it preferred', () => {
    setup();
    pick('screw');
    pick('M3');
    pick('0.5');
    pick('8');
    pick('pan');
    pick('phillips');
    skipRestAndSearch();

    expect(rowOrder()[0]).toBe('07052664');
    const preferred = screen.getByLabelText('Preferred part');
    expect(within(preferred).getByText('07052664')).toBeTruthy();
    expect(screen.getByText(/Sample volumes\./)).toBeTruthy();
  });

  it('a 5.4 mm search surfaces the 5.5 mm high runner as a close match', () => {
    setup();
    pick('screw');
    pick('M3');
    pick('0.5');
    pick('5.4');
    skipRestAndSearch();

    expect(rowOrder()).toEqual(['12345007', '12345006']);
    const row = document.getElementById('row-12345006')!;
    expect(within(row).getByText('Close match')).toBeTruthy();
    expect(within(screen.getByLabelText('Preferred part')).getByText('12345006')).toBeTruthy();
  });

  it('a typed pitch with no exact match still dead-ends in strict mode', () => {
    setup();
    pick('screw');
    pick('M3');
    pick('0.35');
    let skip = screen.queryByRole('button', { name: /^skip —/i });
    while (skip) {
      fireEvent.click(skip);
      skip = screen.queryByRole('button', { name: /^skip —/i });
    }
    fireEvent.click(screen.getByText('Strict mode'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Search parts' }));
    expect(screen.getByText('No existing part matched')).toBeTruthy();
  });
});
