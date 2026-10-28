import { useEffect, useLayoutEffect, useMemo, useRef, useState, KeyboardEvent } from 'react';
import type { VocabOption } from '../../types';
import { Icon } from './Icon';

export interface OptionComboboxProps {
  options: VocabOption[];
  value: string | number | null;
  onSelect: (canonical: string) => void;
  placeholder: string;
  renderCount?: (option: VocabOption) => string;
  /**
   * Numeric steps: let the engineer type a value that is not on the list
   * (e.g. 5.4 mm). Near-matches within tolerance still surface.
   */
  customUnit?: 'mm';
  /** Shown beside a typed custom value, e.g. how near-matches are treated. */
  customHint?: string;
}

interface Row {
  canonical: string;
  label: string;
  count: number | null;
  custom?: boolean;
}

export function OptionCombobox({
  options,
  value,
  onSelect,
  placeholder,
  renderCount,
  customUnit,
  customHint,
}: OptionComboboxProps) {
  const [filter, setFilter] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Focus the search box whenever the option set changes (a new step), so the
  // flow is always type → Enter. Keyed on content, not array identity.
  const optionsKey = options.map((o) => o.canonical).join('|');
  useLayoutEffect(() => {
    inputRef.current?.focus();
    setFilter('');
    setHighlight(0);
  }, [optionsKey]);

  // Clear synchronously on pick, so keystrokes that arrive before the next
  // step renders don't land on top of the old filter.
  function pick(canonical: string) {
    setFilter('');
    setHighlight(0);
    onSelect(canonical);
  }

  const maxCount = useMemo(
    () => options.reduce((m, o) => Math.max(m, o.count), 0),
    [options]
  );

  const rows: Row[] = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const matched = !q
      ? options
      : options.filter(
          (o) =>
            o.label.toLowerCase().includes(q) ||
            o.canonical.toLowerCase().includes(q) ||
            o.rawVariants.some((v) => v.toLowerCase().includes(q))
        );
    const out: Row[] = matched.map((o) => ({
      canonical: o.canonical,
      label: o.label,
      count: o.count,
    }));
    if (customUnit) {
      const n = Number(q.replace(/\s*mm$/, ''));
      const exists = options.some((o) => Math.abs(Number(o.canonical) - n) < 0.001);
      if (q && Number.isFinite(n) && n > 0 && !exists) {
        out.unshift({
          canonical: String(n),
          label: `${n} ${customUnit}`,
          count: null,
          custom: true,
        });
      }
    }
    return out;
  }, [filter, options, customUnit]);

  useEffect(() => {
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight]);

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(rows.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const choice = rows[highlight];
      if (choice) pick(choice.canonical);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setFilter('');
    }
  }

  return (
    <div className="combobox">
      <div className="combobox-field">
        <span className="combobox-icon"><Icon name="search" /></span>
        <input
          ref={inputRef}
          className="combobox-input"
          type="text"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setHighlight(0);
          }}
          onKeyDown={onKey}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete="off"
        />
        <span className="kbd-hints" aria-hidden="true">
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          <kbd>Enter</kbd>
        </span>
      </div>
      <ul className="combobox-list" role="listbox" ref={listRef}>
        {rows.length === 0 ? (
          <li className="combobox-empty">
            Nothing matches “{filter}”. Try another term, or skip this step.
          </li>
        ) : (
          rows.map((o, i) => {
            const selected = value !== null && String(value) === o.canonical;
            const pct =
              o.count !== null && maxCount > 0
                ? Math.max(4, Math.round((o.count / maxCount) * 100))
                : 0;
            return (
              <li
                key={(o.custom ? 'custom:' : '') + o.canonical}
                role="option"
                aria-selected={selected}
                className={`combobox-option${i === highlight ? ' is-highlighted' : ''}${
                  selected ? ' is-selected' : ''
                }${o.custom ? ' is-custom' : ''}`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(o.canonical)}
              >
                <span className="combobox-label">
                  {o.custom ? <span className="combobox-use">Use</span> : null}
                  {o.label}
                  {selected ? (
                    <span className="combobox-check">
                      <Icon name="check" size={14} /> current
                    </span>
                  ) : null}
                </span>
                {o.custom ? (
                  <span className="combobox-hint">{customHint}</span>
                ) : (
                  <span className="combobox-count">
                    <span className="count-bar" aria-hidden="true">
                      <span style={{ width: `${pct}%` }} />
                    </span>
                    <span className="count-num">
                      {renderCount
                        ? renderCount(options.find((x) => x.canonical === o.canonical)!)
                        : o.count}
                    </span>
                  </span>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
