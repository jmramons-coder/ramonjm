import styles from "./microsoft-brand.module.css";

export function MicrosoftBrand() {
  return (
    <span className={styles.brand}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#f25022" d="M0 0h11.4v11.4H0z" />
        <path fill="#7fba00" d="M12.6 0H24v11.4H12.6z" />
        <path fill="#00a4ef" d="M0 12.6h11.4V24H0z" />
        <path fill="#ffb900" d="M12.6 12.6H24V24H12.6z" />
      </svg>
      <span>Microsoft</span>
    </span>
  );
}
