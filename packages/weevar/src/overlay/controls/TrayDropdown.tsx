import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { TypoChevronIcon } from "./typographyIcons";

export type TrayDropdownOption = { value: string; label: string };

export function isEventInsideNode(
  e: PointerEvent,
  node: HTMLElement,
): boolean {
  if (e.composedPath().includes(node)) return true;
  const target = e.target;
  return target instanceof Node && node.contains(target);
}

export function stopTrayDropdownTriggerPointerDown(
  e: ReactPointerEvent,
): void {
  e.stopPropagation();
}

export function useDismissOnOutsidePointerDown(
  active: boolean,
  rootRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
  menuRef?: RefObject<HTMLElement | null>,
) {
  useLayoutEffect(() => {
    if (!active) return;

    const onPointerDown = (e: PointerEvent) => {
      const root = rootRef.current;
      if (root && isEventInsideNode(e, root)) return;

      const menu = menuRef?.current;
      if (menu && isEventInsideNode(e, menu)) return;

      onDismiss();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [active, onDismiss, rootRef, menuRef]);
}

export function useTrayDropdown(onOpen?: () => void) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) onOpen?.();
      return !prev;
    });
  }, [onOpen]);

  useDismissOnOutsidePointerDown(open, rootRef, close, menuRef);

  return { open, setOpen, toggle, close, rootRef, menuRef };
}

type TrayDropdownMenuProps = {
  menuRef: RefObject<HTMLDivElement | null>;
  value: string;
  options: readonly TrayDropdownOption[];
  onSelect: (value: string) => void;
  ariaLabel: string;
};

export function TrayDropdownMenu({
  menuRef,
  value,
  options,
  onSelect,
  ariaLabel,
}: TrayDropdownMenuProps) {
  return (
    <div
      ref={menuRef}
      className="wv-tray-dropdown-menu wv-tray-dropdown-menu--overlay wv-pe"
      role="listbox"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="option"
          aria-selected={option.value === value}
          className={`wv-tray-dropdown-option wv-pe${
            option.value === value ? " wv-tray-dropdown-option--active" : ""
          }`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onSelect(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

type TrayDropdownProps = {
  value: string;
  options: readonly TrayDropdownOption[];
  onSelect: (value: string) => void;
  onOpen?: () => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  leadingIcon?: ReactNode;
};

export function TrayDropdown({
  value,
  options,
  onSelect,
  onOpen,
  ariaLabel,
  disabled = false,
  className,
  label,
  leadingIcon,
}: TrayDropdownProps) {
  const { open, toggle, close, rootRef, menuRef } = useTrayDropdown(onOpen);
  const selected = options.find((option) => option.value === value);
  const isBorder = !!leadingIcon;

  const handleSelect = (next: string) => {
    if (next !== value) onSelect(next);
    close();
  };

  return (
    <div
      ref={rootRef}
      className={`wv-tray-dropdown wv-pe${className ? ` ${className}` : ""}`}
    >
      <button
        type="button"
        className={`wv-tray-dropdown-trigger wv-pe${
          isBorder
            ? " wv-tray-dropdown-trigger--border"
            : " wv-tray-dropdown-trigger--card"
        }${open ? " wv-tray-dropdown-trigger--open" : ""}`}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onPointerDown={stopTrayDropdownTriggerPointerDown}
        onClick={toggle}
      >
        {label ? <span className="wv-typo-card-label">{label}</span> : null}
        {leadingIcon}
        {isBorder ? (
          <>
            <span className="wv-tray-dropdown-value wv-tray-dropdown-value--border">
              {selected?.label ?? value}
            </span>
            <span className="wv-tray-dropdown-trailing wv-tray-dropdown-trailing--end">
              <span
                className={`wv-tray-dropdown-chevron${
                  open ? " wv-tray-dropdown-chevron--open" : ""
                }`}
              >
                <TypoChevronIcon />
              </span>
            </span>
          </>
        ) : (
          <span className="wv-tray-dropdown-trailing">
            <span className="wv-tray-dropdown-value">
              {selected?.label ?? value}
            </span>
            <span
              className={`wv-tray-dropdown-chevron${
                open ? " wv-tray-dropdown-chevron--open" : ""
              }`}
            >
              <TypoChevronIcon />
            </span>
          </span>
        )}
      </button>
      {open ? (
        <TrayDropdownMenu
          menuRef={menuRef}
          value={value}
          options={options}
          onSelect={handleSelect}
          ariaLabel={ariaLabel}
        />
      ) : null}
    </div>
  );
}

type TrayDropdownChevronTriggerProps = {
  open: boolean;
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean;
};

export function TrayDropdownChevronTrigger({
  open,
  onClick,
  ariaLabel,
  disabled = false,
}: TrayDropdownChevronTriggerProps) {
  return (
    <button
      type="button"
      className="wv-tray-dropdown-chevron-trigger wv-pe"
      aria-label={ariaLabel}
      aria-expanded={open}
      aria-haspopup="listbox"
      disabled={disabled}
      onPointerDown={stopTrayDropdownTriggerPointerDown}
      onClick={onClick}
    >
      <span
        className={`wv-tray-dropdown-chevron${
          open ? " wv-tray-dropdown-chevron--open" : ""
        }`}
      >
        <TypoChevronIcon />
      </span>
    </button>
  );
}
