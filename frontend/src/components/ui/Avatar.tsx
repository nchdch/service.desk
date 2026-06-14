import type { CSSProperties, HTMLAttributes } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'busy' | 'away' | 'offline';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  color?: string;
}

const PALETTE = [
  '#16a34a',
  '#ea580c',
  '#4f46e5',
  '#0ea5e9',
  '#8b5cf6',
  '#dc2626',
  '#0d9488',
  '#ca8a04',
];

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 22,
  sm: 26,
  md: 30,
  lg: 40,
  xl: 56,
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + second).toUpperCase();
}

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function Avatar({
  name,
  src,
  size = 'md',
  status,
  color,
  className,
  style,
  ...rest
}: AvatarProps) {
  const classes = [
    'vds-avatar',
    size !== 'md' ? `vds-avatar--${size}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const px = SIZE_PX[size];
  const mergedStyle: CSSProperties = {
    background: src ? undefined : (color ?? hashColor(name)),
    ...style,
  };

  return (
    <span className={classes} style={mergedStyle} {...rest}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="vds-avatar__img"
          src={src}
          alt={name}
          width={px}
          height={px}
        />
      ) : (
        <span className="vds-avatar__txt">{initials(name)}</span>
      )}
      {status && (
        <span className={`vds-avatar__status vds-avatar__status--${status}`} />
      )}
    </span>
  );
}
