import { useState, useRef, useId } from 'react';
import './Tooltip.css';

export function Tooltip({ content, label }) {
  // label: field name for aria-label (e.g., "nome", "CPF")
  // content: tooltip text string
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, flip: false });
  const triggerRef = useRef(null);
  const tooltipId = useId();

  const show = () => {
    const rect = triggerRef.current.getBoundingClientRect();
    const flip = rect.top < 80; // flip below if near top of viewport
    setPosition({
      x: rect.left + rect.width / 2,
      y: flip ? rect.bottom + 8 : rect.top - 8,
      flip
    });
    setVisible(true);
  };

  const hide = () => setVisible(false);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="tooltip-trigger"
        aria-label={`Informacoes sobre ${label}`}
        aria-describedby={visible ? tooltipId : undefined}
        onMouseEnter={show}
        onFocus={show}
        onMouseLeave={hide}
        onBlur={hide}
      >
        &#9432;
      </button>
      {visible && (
        <div
          id={tooltipId}
          className={`tooltip-portal${position.flip ? ' tooltip-portal--below' : ''}`}
          role="tooltip"
          style={{
            top: position.y,
            left: position.x,
          }}
        >
          {content}
          <div className="tooltip-arrow" />
        </div>
      )}
    </>
  );
}
