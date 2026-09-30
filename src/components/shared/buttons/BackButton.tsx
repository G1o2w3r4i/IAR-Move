import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export interface BackButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  size?: number;
  width?: string | number;
  height?: string | number;
}

/**
 * Standardized Back Button
 * Compact icon-only back button:
 * 26x26px, 1px border (#CBD5E1), white background with subtle hover & elevation.
 */
export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  title = 'Back',
  ariaLabel = 'Back',
  className,
  style,
  size = 14,
  width = '26px',
  height = '26px',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={title}
      aria-label={ariaLabel}
      className={className}
      style={{
        border: isHovered ? '1px solid #94A3B8' : '1px solid #CBD5E1',
        backgroundColor: isHovered ? '#F1F5F9' : '#FFFFFF',
        cursor: 'pointer',
        color: '#334155',
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: '5px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s ease',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        outline: 'none',
        padding: 0,
        ...style,
      }}
    >
      <ArrowLeft size={size} />
    </button>
  );
};

export const SharedBackButton = BackButton;
