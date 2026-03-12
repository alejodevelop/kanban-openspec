import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";

type DialogProps = {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export const Dialog = ({ actions, children, description, onClose, open, title }: DialogProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const focusTarget = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    focusTarget?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="dialog-backdrop" onMouseDown={handleBackdropMouseDown} role="presentation">
      <div
        aria-describedby={description === undefined ? undefined : descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="dialog-panel"
        ref={panelRef}
        role="dialog"
      >
        <div className="dialog-header">
          <div className="dialog-copy">
            <h2 id={titleId}>{title}</h2>
            {description === undefined ? null : <p id={descriptionId}>{description}</p>}
          </div>
          <button aria-label="Cerrar dialogo" className="tertiary-button" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        {actions === undefined ? null : <div className="dialog-actions">{actions}</div>}
      </div>
    </div>
  );
};
