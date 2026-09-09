import { useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { countryAdjacency } from "../data/countryAdjacency";
import { normalize } from "../game/gameEngine";
import styles from "./GuessInput.module.css";

type GuessInputProps = {
  onGuess: (guess: string) => void;
  disabled?: boolean;
  /** Country names that should no longer be suggested (start + already correctly guessed). */
  excludeNames?: string[];
  /** Brief visual feedback for the most recent guess's outcome (auto-clears itself upstream). */
  feedback?: "correct" | "wrong" | null;
};

const ALL_COUNTRIES = Object.keys(countryAdjacency).sort();
const MAX_SUGGESTIONS = 8;

/**
 * Text input with an autocomplete dropdown. Suggests matching countries
 * from the adjacency list as the player types; Enter or clicking a
 * suggestion applies the selection and reports it via `onGuess`.
 */
export function GuessInput({
  onGuess,
  disabled = false,
  excludeNames = [],
  feedback = null,
}: GuessInputProps) {
  const [value, setValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const feedbackClass =
    feedback === "wrong" ? styles.shake : feedback === "correct" ? styles.pulseCorrect : "";

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        className={`${styles.input} ${feedbackClass}`}
        type="text"
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        placeholder="Type a country…"
        value={value}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setIsOpen(true);
          // On mobile, the on-screen keyboard can otherwise cover the
          // input (or its autocomplete dropdown) right after it opens.
          setTimeout(() => {
            inputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
          }, 300);
        }}
        onBlur={() => setIsOpen(false)}
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-label="Guess a country"
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
              // onMouseDown (instead of onClick) fires before the input's
              // blur, otherwise the dropdown would already have vanished.
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
