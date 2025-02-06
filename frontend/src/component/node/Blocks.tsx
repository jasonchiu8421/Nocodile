import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { theme } from 'antd';

interface BlockProps {
  target?: string | null;
  source?: string | null;
  children?: React.ReactNode;
}

function Block({ target, source, children }: BlockProps) {
  const { token } = theme.useToken();

  return (
    <div style={{ position: 'relative' }}>
      {target && ( // Input
        <Handle
          key={target}
          id={target}
          type="target"
          position={Position.Left}
        />
      )}
      <div style={{ padding: `0px ${token.paddingXS}px` }}>{children}</div>
      {source && ( // Output
        <Handle
          key={source}
          id={source}
          type="source"
          position={Position.Right}
        />
      )}
    </div>
  );
}

export default Block;
