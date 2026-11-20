import React from 'react';
import { RouterPanel } from './RouterPanel.jsx';
import { RouterIcon } from './icons.jsx';
import { CSS } from './css.js';

const PANEL_ID = 'dsh-router-agent';
const STYLE_ATTR = 'data-plugin="dsh-router-agent"';

function insertStyles() {
  if (typeof document === 'undefined') return () => {};
  const previous = document.querySelector(`style[${STYLE_ATTR}]`);
  if (previous) {
    previous.textContent = CSS;
    return () => {};
  }
  const style = document.createElement('style');
  style.setAttribute('data-plugin', 'dsh-router-agent');
  style.textContent = CSS;
  document.head.appendChild(style);
  return () => style.remove();
}

function SidebarIcon({ size = 20 }) {
  return <RouterIcon size={size} />;
}

export const inject = ['slots'];

export function apply(ctx) {
  ctx.effect(() => insertStyles(), 'dsh-router-agent: styles');

  const openSession = (sessionId) => {
    try {
      // Resolve lazily: client modules can load in any order and `uiWorkspace`
      // may mount after this apply. `openSession` accepts a SessionId string
      // or a SubagentAddress, not an object wrapper (which resolves to
      // `undefined` in the session controller).
      ctx.get('uiWorkspace')?.openSession?.(sessionId);
    } catch {
      // Navigation is owned by the app; a missing service leaves the panel read-only.
    }
  };
  const Panel = (props) => <RouterPanel {...props} openSession={openSession} />;

  ctx.slots.inject('main', () =>
    ctx.slots.register(
      {
        name: 'main',
        key: PANEL_ID,
      },
      Panel,
    ),
  );

  ctx.slots.inject('sidebar.panellist', () =>
    ctx.slots.register(
      {
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 30,
        label: () => 'Router',
      },
      SidebarIcon,
    ),
  );
}
