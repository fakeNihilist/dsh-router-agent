import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Theme-aware hover tooltip.
 *
 * Native `title` tooltips are painted by the OS, so their font, delay and
 * colours cannot follow the panel theme. This renders a small bubble in the
 * panel's own surface, positioned above the anchor and clamped to the panel.
 */
export function Tip({ label, children }) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState(null);
  const anchorRef = useRef(null);
  const timerRef = useRef(0);

  const show = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const anchor = anchorRef.current;
      const panel = anchor?.closest?.('.dra');
      if (!anchor || !panel) return;
      const rect = anchor.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const half = 130;
      const center = rect.left - panelRect.left + rect.width / 2;
      setPlacement({
        left: Math.min(Math.max(center, half + 8), Math.max(half + 8, panelRect.width - half - 8)),
        top: rect.top - panelRect.top - 8,
      });
      setOpen(true);
    }, 140);
  }, []);

  const hide = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setOpen(false);
  }, []);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  const panel = open && placement ? anchorRef.current?.closest?.('.dra') : null;

  return (
    <>
      <span
        ref={anchorRef}
        className="dra-tip-anchor"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {panel && placement
        ? createPortal(
            <span className="dra-tip" role="tooltip" style={{ left: placement.left, top: placement.top }}>
              {label}
            </span>,
            panel,
          )
        : null}
    </>
  );
}
