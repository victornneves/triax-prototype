import './Button.css';

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children,
  type = 'button',
  className = '',
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size}${loading ? ' btn--loading' : ''} ${className}`.trim()}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <span className="btn__spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
