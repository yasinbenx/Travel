import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Last-resort fallback for render-time crashes (e.g. corrupted map data or
 * localStorage) so a bug shows a recoverable message instead of a blank
 * white screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("BorderHop crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className={styles.screen}>
        <div className={styles.card}>
          <h1 className={styles.title}>Something went wrong</h1>
          <p className={styles.text}>
            BorderHop hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            type="button"
            className={styles.button}
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
