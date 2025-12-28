import { useState, useEffect } from "react";
import { storage } from "../utils/storage";

export function useWidget() {
  const [isOpen, setIsOpen] = useState(() => storage.getIsOpen());

  // Persist open state
  useEffect(() => {
    storage.setIsOpen(isOpen);
  }, [isOpen]);

  const toggle = () => setIsOpen((prev) => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    toggle,
    open,
    close,
  };
}
