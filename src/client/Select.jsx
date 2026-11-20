import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Theme-aware dropdown.
 *
 * Native <select> popups are painted by the OS: their font, hover colour and
 * corner radius ignore the panel theme (on Windows they render at the system
 * UI size, ~2px larger than the trigger). This component renders its own
 * listbox so the closed control and the open list share the same type scale,
 * theme tokens and DSH surface. The popup is portalled into the `.dra` root so
 * it escapes the settings dialog's scroll container while keeping the panel's
 * CSS variables, and it flips above the trigger when space runs out.
 */

let counter = 0;

function buildEntries(options, groups) {
  const list = [];
  for (const option of options ?? []) list.push({ kind: 'option', ...option });
  for (const group of groups ?? []) {
    list.push({ kind: 'group', label: group.label ?? group.id ?? '' });
    for (const option of group.options ?? []) list.push({ kind: 'option', ...option });
  }
  return list;
}

export function Select({
  value,
  onChange,
  options = [],
  groups = [],
  placeholder = '请选择',
  disabled = false,
  className = '',
  id,
  ariaLabel,
  title,
  menuMinWidth = 200,
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [placement, setPlacement] = useState(null);
  const [baseId] = useState(() => `dra-sel-${(counter += 1)}`);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const popRef = useRef(null);

  const entries = useMemo(() => buildEntries(options, groups), [options, groups]);
  const selectable = useMemo(
    () => entries.filter((entry) => entry.kind === 'option' && !entry.disabled),
    [entries],
  );
  const current = entries.find((entry) => entry.kind === 'option' && entry.value === value);
  const label = current?.label ?? placeholder;
  const listboxId = `${baseId}-listbox`;
  const optionDomId = useCallback(
    (entry) => `${baseId}-opt-${entries.indexOf(entry)}`,
    [baseId, entries],
  );

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = trigger?.closest?.('.dra');
    if (!trigger || !panel) return;
    const rect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const gap = 5;
    const edge = 8;
    const below = panelRect.bottom - rect.bottom - gap - edge;
    const above = rect.top - panelRect.top - gap - edge;
    const up = below < 170 && above > below;
    const width = Math.max(
      120,
      Math.min(Math.max(rect.width, Math.min(menuMinWidth, panelRect.width - edge * 2)), panelRect.width - edge * 2),
    );
    const left = Math.min(
      Math.max(edge, rect.left - panelRect.left),
      Math.max(edge, panelRect.width - edge - width),
    );
    setPlacement({
      up,
      left,
      width,
      maxHeight: Math.max(120, Math.min(320, up ? above : below)),
      top: rect.bottom - panelRect.top + gap,
      bottom: panelRect.bottom - rect.top + gap,
    });
  }, [menuMinWidth]);

  const close = useCallback((focusTrigger = false) => {
    setOpen(false);
    setPlacement(null);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    place();
    const at = selectable.findIndex((entry) => entry.value === value);
    setActive(at >= 0 ? at : 0);
    setOpen(true);
  }, [disabled, place, selectable, value]);

  const toggle = () => {
    if (disabled) return;
    if (open) close(true);
    else openMenu();
  };

  const choose = (entry) => {
    if (!entry || entry.kind !== 'option' || entry.disabled) return;
    close(true);
    if (entry.value !== value) onChange?.(entry.value, entry);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      if (popRef.current?.contains(event.target)) return;
      close(false);
    };
    const onViewport = (event) => {
      // Let the list itself scroll; any outer scroll/resize invalidates the
      // trigger-relative coordinates.
      if (event?.target && popRef.current?.contains(event.target)) return;
      close(false);
    };
    document.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('resize', onViewport);
    window.addEventListener('scroll', onViewport, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      window.removeEventListener('resize', onViewport);
      window.removeEventListener('scroll', onViewport, true);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    popRef.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active]);

  const onKeyDown = (event) => {
    if (disabled) return;
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openMenu();
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === 'Tab') {
      close(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!selectable.length) return;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setActive((currentIndex) => {
        const from = currentIndex >= 0 ? currentIndex : 0;
        return (from + delta + selectable.length) % selectable.length;
      });
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (selectable.length) setActive(event.key === 'Home' ? 0 : selectable.length - 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(selectable[active]);
    }
  };

  const activeEntry = selectable[active];
  const panel = open && placement ? triggerRef.current?.closest?.('.dra') ?? document.body : null;

  return (
    <div className={`dra-select ${className}`.trim()} ref={rootRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="dra-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeEntry ? optionDomId(activeEntry) : undefined}
        aria-label={ariaLabel}
        title={title ?? label}
        data-value={value ?? ''}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <span className="dra-select-value">{label}</span>
        <span className="dra-caret" aria-hidden="true" />
      </button>
      {panel
        ? createPortal(
            <div
              ref={popRef}
              id={listboxId}
              className="dra-select-pop"
              role="listbox"
              aria-label={ariaLabel}
              style={{
                left: placement.left,
                width: placement.width,
                maxHeight: placement.maxHeight,
                ...(placement.up
                  ? { bottom: placement.bottom, top: 'auto' }
                  : { top: placement.top, bottom: 'auto' }),
              }}
            >
              {entries.map((entry, index) =>
                entry.kind === 'group' ? (
                  <div className="dra-select-group" role="presentation" key={`${baseId}-g-${index}`}>
                    {entry.label}
                  </div>
                ) : (
                  <div
                    id={optionDomId(entry)}
                    className="dra-select-option"
                    role="option"
                    key={`${baseId}-o-${index}`}
                    aria-selected={entry.value === value}
                    aria-disabled={entry.disabled || undefined}
                    data-value={entry.value}
                    data-selected={entry.value === value ? 'true' : undefined}
                    data-active={activeEntry === entry ? 'true' : undefined}
                    data-disabled={entry.disabled ? 'true' : undefined}
                    title={entry.label}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => {
                      const at = selectable.indexOf(entry);
                      if (at >= 0) setActive(at);
                    }}
                    onClick={() => choose(entry)}
                  >
                    <span className="dra-select-option-label">{entry.label}</span>
                    {entry.value === value ? (
                      <span className="dra-select-check" aria-hidden="true">
                        ✓
                      </span>
                    ) : null}
                  </div>
                ),
              )}
            </div>,
            panel,
          )
        : null}
    </div>
  );
}
