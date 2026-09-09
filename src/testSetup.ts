/**
 * Vitest runs in a plain Node environment (no DOM) for this project's
 * pure-logic test suite. A handful of modules (streak/persistence) touch
 * `localStorage`, so this provides a minimal in-memory polyfill instead
 * of pulling in a full jsdom/happy-dom environment just for one global.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

if (typeof globalThis.localStorage === "undefined") {
  globalThis.localStorage = new MemoryStorage();
}
