import { useEffect, useState } from "react";

export type ToolbarSearch = { value: string; onChange: (value: string) => void; placeholder: string; label: string };

const DELAY = 250;

// The toolbar's search input. What is typed shows at once; `onChange` gets it once typing pauses,
// so a value kept in the URL can't lag behind fast typing and drop letters.
// A new `value` from outside (cleared, Back) replaces the text.
function SearchBox({ value, onChange, placeholder, label }: ToolbarSearch) {
  const [text, setText] = useState(value);
  const [outside, setOutside] = useState(value);
  if (value !== outside) {
    setOutside(value);
    setText(value);
  }

  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => onChange(text), DELAY);
    return () => clearTimeout(timer);
  }, [text, value, onChange]);

  return (
    <div className="app-results-search">
      <i className="bi bi-search" aria-hidden="true" />
      <input
        type="search"
        className="form-control form-control-sm"
        placeholder={placeholder}
        aria-label={label}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}

export default SearchBox;
