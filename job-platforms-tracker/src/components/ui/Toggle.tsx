'use client';

interface ToggleProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
}

export default function Toggle({ options, value, onChange, size = 'sm' }: ToggleProps) {
  const padClass = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5';
  const textClass = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <div className="inline-flex border border-border rounded overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`${padClass} ${textClass} font-mono uppercase tracking-wide transition-colors ${
            value === opt.value
              ? 'bg-ink text-white'
              : 'bg-surface text-ink-muted hover:text-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
