import { CSSProperties } from 'react';

type Props = {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
};

/** Renders a Material Symbols Outlined glyph by name — see layout.tsx for the font import. */
export function Icon({ name, size = 18, className = '', style }: Props) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, lineHeight: 1, ...style }}
      aria-hidden
    >
      {name}
    </span>
  );
}
