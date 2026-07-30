import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const getFocusableElements = (container) => {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true",
  );
};

export default function useDialogFocus(
  open,
  {
    dialogRef: suppliedDialogRef,
    initialFocusRef,
    onClose,
    closeOnEscape = true,
  } = {},
) {
  const internalDialogRef = useRef(null);
  const dialogRef = suppliedDialogRef || internalDialogRef;
  const previouslyFocusedRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocusedRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusInitial = () => {
      if (initialFocusRef?.current && !initialFocusRef.current.disabled) {
        initialFocusRef.current.focus();
        return;
      }
      const focusables = getFocusableElements(dialogRef.current);
      if (focusables.length > 0) focusables[0].focus();
      else dialogRef.current?.focus();
    };
    const timeoutId = window.setTimeout(focusInitial, 0);

    const handleKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        closeOnEscape &&
        typeof onCloseRef.current === "function"
      ) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = getFocusableElements(dialogRef.current);
      if (focusables.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      const previous = previouslyFocusedRef.current;
      if (previous?.isConnected && typeof previous.focus === "function") {
        window.setTimeout(() => previous.focus(), 0);
      } else {
        window.setTimeout(() => {
          document.getElementById("main-content")?.focus();
        }, 0);
      }
    };
  }, [open, closeOnEscape, dialogRef, initialFocusRef]);

  return dialogRef;
}
