import styles from './app-shell.module.css';

/** Reuses the municipality asset already owned by the app and follows the active theme. */
export function MunicipalityLogo({
  className,
  variant = 'wordmark',
}: {
  className?: string;
  variant?: 'wordmark' | 'symbol';
}) {
  const source = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/svg/SK_logo.svg`;
  if (variant === 'symbol') {
    return (
      <svg
        role="img"
        aria-label="Sundsvalls kommun"
        focusable="false"
        viewBox="0 0 25 44"
        className={['h-8 w-auto shrink-0', className].filter(Boolean).join(' ')}
      >
        <use href={`${source}#sundsvall-dragon`} />
      </svg>
    );
  }
  return (
    <span
      role="img"
      aria-label="Sundsvalls kommun"
      className={[styles.municipalityLogo, className].filter(Boolean).join(' ')}
      style={{ maskImage: `url("${source}")` }}
    />
  );
}
