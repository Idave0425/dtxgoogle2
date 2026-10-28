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
  let skip = screen.queryByRole('button', { name: 'Skip this step' });
  while (skip) {
    fireEvent.click(skip);
    skip = screen.queryByRole('button', { name: 'Skip this step' });
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
    expect(within(document.getElementById('row-07052664')!).getByText('Preferred')).toBeTruthy();
    expect(document.querySelector('.title-sub')!.textContent).toMatch(/07052664 is ordered most/);
    expect(screen.getByText(/proof-of-concept sample data, not Google order history/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy 07052664' })).toBeTruthy();
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
    expect(within(row).getByText('Preferred')).toBeTruthy();
    expect(document.querySelector('.title-sub')!.textContent).toMatch(/close match: length 5\.5 mm, you asked 5\.4 mm/);
  });

  it('a typed pitch with no exact match still dead-ends in strict mode', () => {
    setup();
    pick('screw');
    pick('M3');
    pick('0.35');
    let skip = screen.queryByRole('button', { name: 'Skip this step' });
    while (skip) {
      fireEvent.click(skip);
      skip = screen.queryByRole('button', { name: 'Skip this step' });
    }
    fireEvent.click(screen.getByText('Strict mode'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Search parts' }));
    expect(document.querySelector('.title-sub')!.textContent).toMatch(/No existing GPN fits/);
  });
});
