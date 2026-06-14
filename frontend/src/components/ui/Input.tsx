import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export type InputSize = 'sm' | 'md';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  size?: InputSize;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function Input({
  label,
  hint,
  error,
  required = false,
  size = 'md',
  icon,
  fullWidth = false,
  className,
  id,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;

  const fieldClasses = ['vds-field', fullWidth ? 'vds-field--full' : '', className]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [
    'vds-input',
    size === 'sm' ? 'vds-input--sm' : '',
    error ? 'vds-input--invalid' : '',
    icon ? 'vds-input--with-icon' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={fieldClasses}>
      {label && (
        <label className="vds-field__label" htmlFor={inputId}>
          {label}
          {required && <span className="vds-field__req">*</span>}
        </label>
      )}
      <div className="vds-input-wrap">
        {icon && <span className="vds-input__icon">{icon}</span>}
        <input
          id={inputId}
          className={inputClasses}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={hint || error ? hintId : undefined}
          {...rest}
        />
      </div>
      {(hint || error) && (
        <span id={hintId} className={`vds-field__hint ${error ? 'vds-field__hint--error' : ''}`.trim()}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
