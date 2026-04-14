interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'confirmed' | 'estimated' | 'reported';
}

const variants = {
  default: 'bg-surface-raised text-ink-muted',
  confirmed: 'bg-surface-raised text-ink font-medium',
  estimated: 'bg-surface-raised text-ink-muted',
  reported: 'bg-surface-raised text-ink-muted',
};

export default function Tag({ children, variant = 'default' }: TagProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[11px] rounded border border-border ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
