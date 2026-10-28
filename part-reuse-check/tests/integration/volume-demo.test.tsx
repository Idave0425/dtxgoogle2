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
  it('happy path: volume reads pending, nothing is preferred or invented', () => {
    setup();
    pick('screw');
    pick('M3');
    pick('0.5');
    pick('8');
    pick('pan');
    pick('phillips');
    skipRestAndSearch();

    expect(rowOrder()).toContain('07052664');
    expect(screen.getByText(/Volume pending: waiting on vendor order data from Google/)).toBeTruthy();
    expect(screen.queryByText('Preferred')).toBeNull();
    expect(screen.queryByText('High runner')).toBeNull();
    const vols = Array.from(document.querySelectorAll('.row-result .col-vol')).map((c) => c.textContent);
    expect(vols.every((v) => v === 'pending')).toBe(true);
    expect(document.querySelector('.title-sub')!.textContent).not.toMatch(/ordered most/);
  });

  it('a 5.4 mm search still surfaces the 5.5 mm part as a close match', () => {
    setup();
    pick('screw');
    pick('M3');
    pick('0.5');
    pick('5.4');
    skipRestAndSearch();

    expect(rowOrder()).toEqual(['12345007', '12345006']);
    const row = document.getElementById('row-12345006')!;
    expect(within(row).getByText('Close match')).toBeTruthy();
  });

  it('hides compare controls when only one part fits', () => {
    setup();
    pick('screw');
    pick('M5');
    pick('0.8');
    pick('25');
    skipRestAndSearch();

    expect(rowOrder()).toEqual(['12345012']);
    expect(screen.queryByRole('button', { name: /Compare \d of 2/ })).toBeNull();
    expect(document.querySelector('.row-result input[type="checkbox"]')).toBeNull();
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
    fireEvent.click(screen.getByText('Hide parts with unknown specs'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Search parts' }));
    expect(document.querySelector('.title-sub')!.textContent).toMatch(/No existing GPN fits/);
  });
});
