import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';

export const PhaseNavigation: React.FC = () => {
  const { currentPhase, setCurrentPhase, phases } = useNavigation();
  const itemRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const hasMountedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    top: number;
    width: number;
    opacity: number;
  }>({
    left: 0,
    top: 0,
    width: 0,
    opacity: 0,
  });

  const updateIndicator = () => {
    const activeEl = itemRefs.current[currentPhase];
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        top: activeEl.offsetTop + activeEl.offsetHeight - 4,
        width: activeEl.offsetWidth,
        opacity: 1,
      });
    }
  };

  useLayoutEffect(() => {
    updateIndicator();
    if (!hasMountedRef.current) {
      const raf = requestAnimationFrame(() => {
        hasMountedRef.current = true;
        setIsReady(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [currentPhase]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    if ((document as any).fonts?.ready) {
      (document as any).fonts.ready.then(updateIndicator);
    }
    return () => window.removeEventListener('resize', updateIndicator);
  }, [currentPhase]);

  return (
    <nav className="jnj-nav-bar">
      {phases.map((phase) => {
        const isActive = currentPhase === phase.id;
        return (
          <button
            key={phase.id}
            ref={(el) => {
              itemRefs.current[phase.id] = el;
            }}
            onClick={() => setCurrentPhase(phase.id)}
            className={`jnj-nav-item ${isActive ? 'active' : ''}`}
          >
            <span>{phase.label}</span>
          </button>
        );
      })}

      {/* Subtle gliding bottom line indicator */}
      <span
        className="jnj-nav-indicator"
        style={{
          transform: `translate3d(${indicatorStyle.left}px, ${indicatorStyle.top}px, 0)`,
          width: `${indicatorStyle.width}px`,
          opacity: indicatorStyle.opacity,
          transition: isReady
            ? 'transform 0.32s cubic-bezier(0.25, 1, 0.5, 1), width 0.32s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease'
            : 'opacity 0.2s ease',
        }}
      />
    </nav>
  );
};
