import styles from './app-shell.module.css';

/** Reuses the municipality asset already owned by the app and follows the active theme. */
export function MunicipalityLogo({ className }: { className?: string }) {
  const source = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/svg/SK_logo.svg`;
  return (
    <span
      role="img"
      aria-label="Sundsvalls kommun"
      className={[styles.municipalityLogo, className].filter(Boolean).join(' ')}
      style={{ maskImage: `url("${source}")` }}
    />
  );
}
