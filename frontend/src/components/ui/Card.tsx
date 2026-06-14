import type { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'raised' | 'flat' | 'ghost';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  variant?: CardVariant;
  hoverable?: boolean;
  selected?: boolean;
  flush?: boolean;
}

export function Card({
  title,
  subtitle,
  icon,
  headerAction,
  footer,
  variant = 'raised',
  hoverable = false,
  selected = false,
  flush = false,
  className,
  children,
  ...rest
}: CardProps) {
  const classes = [
    'vds-card',
    variant !== 'raised' ? `vds-card--${variant}` : '',
    hoverable ? 'vds-card--hover' : '',
    selected ? 'vds-card--selected' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const hasHeader = Boolean(title || subtitle || icon || headerAction);

  return (
    <div className={classes} {...rest}>
      {hasHeader && (
        <div className="vds-card__header">
          {icon}
          <div className="vds-card__header-text">
            {title && <div className="vds-card__title">{title}</div>}
            {subtitle && <div className="vds-card__subtitle">{subtitle}</div>}
          </div>
          {headerAction && <div className="vds-card__header-action">{headerAction}</div>}
        </div>
      )}
      <div className={`vds-card__body ${flush ? 'vds-card__body--flush' : ''}`.trim()}>{children}</div>
      {footer && <div className="vds-card__footer">{footer}</div>}
    </div>
  );
}
