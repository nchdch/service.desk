import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

export type IconButtonVariant = 'ghost' | 'solid' | 'primary';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      label,
      variant = 'ghost',
      size = 'md',
      active = false,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      'vds-iconbtn',
      variant !== 'ghost' ? `vds-iconbtn--${variant}` : '',
      size !== 'md' ? `vds-iconbtn--${size}` : '',
      active ? 'vds-iconbtn--active' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        aria-label={label}
        title={label}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
