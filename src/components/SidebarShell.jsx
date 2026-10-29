import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// The dark sidebar container shared by the admin and owner portals.
// lg and up: always visible, fixed on the left (as before).
// Below lg: an off-canvas drawer with a backdrop.
const SidebarShell = ({ open, onClose, children }) => {
  // While the drawer is open: Esc closes it and the page behind can't scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Rotating a tablet or resizing past the breakpoint closes the drawer.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handle = (e) => e.matches && onClose();
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, [onClose]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-ink/50 transition-opacity duration-200 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh w-64 flex-col bg-ink transition-[transform,visibility] duration-200 ease-out lg:visible lg:z-40 lg:translate-x-0",
          // `invisible` also removes the closed drawer from keyboard focus
          open ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-3 top-4 rounded-md p-1.5 text-sand-light/70 transition-colors hover:bg-white/10 hover:text-sand-light lg:hidden"
        >
          <X className="size-5" />
        </button>
        {children}
      </aside>
    </>
  );
};

export default SidebarShell;
