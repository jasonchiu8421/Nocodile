import React from 'react';

interface Props {
  className?: string;
}

export function WireConnection({ className = '' }: Props) {
  return (
    <div className={`flex-1 flex items-center justify-center ${className}`}>
      <div className="h-0.5 w-full bg-gray-300 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-8 bg-blue-500 opacity-75 animate-pulse-wire"></div>
      </div>
    </div>
  );
}
