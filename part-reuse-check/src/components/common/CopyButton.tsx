import { useState } from 'react';
import { Icon } from './Icon';

export function CopyButton({ text, label, primary }: { text: string; label: string; primary?: boolean }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
    setTimeout(() => setState('idle'), 1800);
  }
  return (
    <button className={`btn ${primary ? 'btn-primary' : 'btn-secondary'}`} onClick={copy}>
      <Icon name={state === 'copied' ? 'check' : 'copy'} size={14} />
      {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label}
    </button>
  );
}
