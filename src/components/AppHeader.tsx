import { StartEndBox } from "./StartEndBox";
import styles from "./AppHeader.module.css";

type AppHeaderProps = {
  start: string;
  end: string;
};

/** Schlanke Kopfzeile mit Titel und kompakter Start/Ziel-Anzeige, gemeinsam genutzt von GameBoard und ResultScreen. */
export function AppHeader({ start, end }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Travle-Klon</h1>
      <StartEndBox start={start} end={end} compact />
    </header>
  );
}
