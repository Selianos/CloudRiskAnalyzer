import React from 'react';
import { Box } from '@radix-ui/themes';

/**
 * A reusable Marquee component that continuously scrolls its children.
 * Adapted for Radix UI Themes (no Tailwind required).
 */
export default function Marquee({
  children,
  reverse = false,
  pauseOnHover = false,
  vertical = false,
  repeat = 4,
  duration = '40s',
  gap = '2rem',
  style = {},
  ...props
}) {
  return (
    <Box
      {...props}
      className="marquee-container"
      style={{
        display: 'flex',
        overflow: 'hidden',
        flexDirection: vertical ? 'column' : 'row',
        gap: gap,
        '--duration': duration,
        '--gap': gap,
        ...style
      }}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={`marquee-track ${vertical ? 'marquee-vertical' : ''} ${reverse ? 'marquee-reverse' : ''} ${pauseOnHover ? 'pause-on-hover' : ''}`}
        >
          {children}
        </div>
      ))}
    </Box>
  );
}
