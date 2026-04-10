import { useState, useRef, useId } from 'react';
import './ShortcutLegend.css';

const SHORTCUTS = [
  { key: 'Y', label: 'Sim' },
  { key: 'N', label: 'Nao' },
  { key: 'R', label: 'Gravar audio' },
  { key: 'Esc', label: 'Parar gravacao' },
  { key: 'Shift+Enter', label: 'Nova linha' },
];

export function ShortcutLegend() {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ right: 0, bottom: 0 });
  const triggerRef = useRef(null);
  const legendId = useId();

  const show = () => {
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      right: window.innerWidth - rect.right,
      bottom: window.innerHeight - rect.top + 8,
    });
    setVisible(true);
  };

  const hide = () => setVisible(false);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="shortcut-legend-trigger"
        aria-label="Atalhos do teclado"
        aria-expanded={visible}
        aria-describedby={visible ? legendId : undefined}
        onMouseEnter={show}
        onFocus={show}
        onMouseLeave={hide}
        onBlur={hide}
      >
        ?
      </button>
      {visible && (
        <div
          id={legendId}
          className="shortcut-legend-popover"
          role="tooltip"
          style={{ right: position.right, bottom: position.bottom }}
        >
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="shortcut-legend-row">
              <kbd className="shortcut-legend-key">{s.key}</kbd>
              <span className="shortcut-legend-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
