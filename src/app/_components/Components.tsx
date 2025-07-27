"use client";
import React, { useEffect, useRef } from "react";

export function Popover({
  isOpen,
  onClose,
  children,
  anchorRef,
  moreStyle,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  anchorRef: React.RefObject<HTMLElement | null>;
  moreStyle?: React.CSSProperties
}) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, anchorRef]);

  if (!isOpen || !anchorRef.current) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 bg-white border shadow-lg rounded-[12px] p-3 min-w-[120px]"
      style={{
        borderColor: "hsl(202, 10%, 88%)",
        ...moreStyle
      }}
    >
      {children}
    </div>
  );
}
