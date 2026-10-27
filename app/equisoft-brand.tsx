import Image from "next/image";
import styles from "./equisoft-brand.module.css";

export function EquisoftBrand() {
  return (
    <span className={styles.brand}>
      <Image src="/equisoft-symbol.svg" width={24} height={28} alt="" aria-hidden="true" />
      <span>Equisoft</span>
    </span>
  );
}
