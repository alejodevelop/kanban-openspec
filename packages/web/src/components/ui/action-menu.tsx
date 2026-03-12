import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type ActionMenuProps = {
  children: ReactNode;
  label: string;
};

export const ActionMenu = ({ children, label }: ActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="action-menu" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="menu-trigger"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        Mas
      </button>
      {isOpen ? (
        <div aria-label={label} className="action-menu-panel" id={menuId} role="menu">
          {children}
        </div>
      ) : null}
    </div>
  );
};
