import React from 'react';
/*
interface Props {
  className?: string;
}
*/
export function CircuitBackground({ className = '' }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <pattern id="circuit" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M10 10h80v80h-80z" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
          <circle cx="10" cy="10" r="2" fill="rgba(0,0,0,0.07)" />
          <circle cx="90" cy="10" r="2" fill="rgba(0,0,0,0.07)" />
          <circle cx="10" cy="90" r="2" fill="rgba(0,0,0,0.07)" />
          <circle cx="90" cy="90" r="2" fill="rgba(0,0,0,0.07)" />
          <path d="M10 50h30M50 10v30M90 50h-30M50 90v-30" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
          <circle cx="50" cy="50" r="3" fill="rgba(0,0,0,0.07)" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#circuit)" />
      </svg>
    </div>
  );
}
