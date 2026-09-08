import { useMemo, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { countryAdjacency } from "../data/countryAdjacency";
import { normalize } from "../game/gameEngine";
import styles from "./GuessInput.module.css";

type GuessInputProps = {
  onGuess: (guess: string) => void;
  disabled?: boolean;
  /** Ländernamen, die nicht mehr vorgeschlagen werden sollen (Start + bereits korrekt geratene). */
  excludeNames?: string[];
};

const ALL_COUNTRIES = Object.keys(countryAdjacency).sort();
const MAX_SUGGESTIONS = 8;

/**
 * Texteingabe mit Autocomplete-Dropdown. Schlägt beim Tippen passende
 * Länder aus der Adjazenzliste vor; Enter oder ein Klick auf einen
 * Vorschlag übernimmt die Auswahl und meldet sie über `onGuess`.
 */
export function GuessInput({ onGuess, disabled = false, excludeNames = [] }: GuessInputProps) {
  const [value, setValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const excluded = useMemo(() => new Set(excludeNames), [excludeNames]);

  const suggestions = useMemo(() => {
    const query = normalize(value);
    if (!query) return [];
    return ALL_COUNTRIES.filter(
      (name) => !excluded.has(name) && normalize(name).includes(query),
    )
      .sort((a, b) => {
        const aStartsWith = normalize(a).startsWith(query) ? 0 : 1;
        const bStartsWith = normalize(b).startsWith(query) ? 0 : 1;
        if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;
        return a.localeCompare(b);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [value, excluded]);

  function reset() {
    setValue("");
    setActiveIndex(-1);
    setIsOpen(false);
  }

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    onGuess(trimmed);
    reset();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
    setActiveIndex(-1);
    setIsOpen(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (suggestions.length === 0) return;
      setIsOpen(true);
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (suggestions.length === 0) return;
      setIsOpen(true);
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected = isOpen && activeIndex >= 0 ? suggestions[activeIndex] : undefined;
      submit(selected ?? value);
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  const showDropdown = isOpen && !disabled && suggestions.length > 0;

  return (
    <div className={styles.wrapper}>
      <input
        className={styles.input}
        type="text"
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        placeholder="Land eingeben…"
        value={value}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-label="Land raten"
      />
      {showDropdown && (
        <ul className={styles.dropdown} role="listbox">
          {suggestions.map((name, index) => (
            <li
              key={name}
              role="option"
              aria-selected={index === activeIndex}
              className={
                index === activeIndex
                  ? `${styles.option} ${styles.optionActive}`
                  : styles.option
              }
              // onMouseDown (statt onClick) feuert vor dem Blur des Inputs,
              // sonst würde das Dropdown vorher schon verschwinden.
              onMouseDown={(event) => {
                event.preventDefault();
                submit(name);
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
