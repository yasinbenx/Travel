import { StartEndBox } from "./StartEndBox";
import styles from "./AppHeader.module.css";

type AppHeaderProps = {
  start: string;
  end: string;
};

/** Slim header with the app title and a compact start/target display, shared by GameBoard and ResultScreen. */
export function AppHeader({ start, end }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>BorderHop</h1>
      <StartEndBox start={start} end={end} compact />
    </header>
  );
}
