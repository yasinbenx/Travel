import styles from "./Footer.module.css";

/** Small disclaimer footer: this is a fan-made learning project, not an official product. */
export function Footer() {
  return (
    <p className={styles.footer}>
      A fan-made learning project, not affiliated with any Wordle-style game.{" "}
      <a
        href="https://github.com/yasinbenx"
        target="_blank"
        rel="noreferrer noopener"
        className={styles.link}
      >
        View on GitHub
      </a>
    </p>
  );
}
