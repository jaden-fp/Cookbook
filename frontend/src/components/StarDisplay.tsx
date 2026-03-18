interface Props {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarDisplay({ rating, size = 'md' }: Props) {
  const sizes = { sm: '11px', md: '14px', lg: '18px' };
  const fontSize = sizes[size];
  return (
    <span style={{ letterSpacing: '1px', display: 'inline-flex', gap: '1px' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          style={{
            fontSize,
            color: i < rating ? 'var(--color-gold)' : 'var(--color-warm-border)',
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}
