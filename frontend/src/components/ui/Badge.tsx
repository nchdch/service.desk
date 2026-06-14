import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeTone =
  | 'neutral'
  | 'accent'
  | 'warm'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'ai';
export type BadgeVariant = 'subtle' | 'solid' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
}

export function Badge({
  tone = 'neutral',
  variant = 'subtle',
  size = 'md',
  dot = false,
  icon,
  className,
  children,
  ...rest
}: BadgeProps) {
  const classes = [
    'vds-badge',
    `vds-badge--${variant}`,
    `vds-badge--${tone}`,
    size === 'sm' ? 'vds-badge--sm' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {dot && <span className="vds-badge__dot" />}
      {icon}
      {children}
    </span>
  );
}
