"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Secondary text shown beside the label and searched too (e.g. a category's area). */
  hint?: string;
}

interface ComboboxProps {
  id?: string;
  /** Submitted with the surrounding form (as a hidden input). */
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  invalid?: boolean;
}

/** A searchable dropdown: type to filter, arrow keys + Enter to pick, Escape to close. */
export function Combobox({
  id,
  name,
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches.",
  disabled,
  invalid,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();

  const selected = options.find((option) => option.value === value);
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? options.filter((o) => `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(needle))
    : options;

  React.useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const choose = (option: ComboboxOption) => {
    onValueChange(option.value);
    setOpen(false);
    setQuery("");
  };

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (filtered[active]) choose(filtered[active]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => {
          setOpen((current) => !current);
          setActive(0);
        }}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-left text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          invalid && "border-destructive",
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onSearchKeyDown}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full border-b bg-transparent px-3 py-2 text-sm outline-none"
          />
          <ul id={listId} role="listbox" className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <li className="px-2 py-2 text-sm text-muted-foreground">{emptyText}</li>
            )}
            {filtered.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(option);
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                  index === active && "bg-accent text-accent-foreground",
                )}
              >
                <Check className={cn("h-4 w-4", option.value === value ? "opacity-100" : "opacity-0")} />
                <span className="truncate">{option.label}</span>
                {option.hint && <span className="ml-auto text-xs text-muted-foreground">{option.hint}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
