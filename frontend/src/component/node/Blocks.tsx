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
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: -token.paddingXS,
          }}
        >
          <Handle
            key={target}
            id={target}
            type="target"
            position={Position.Left}
          />
        </div>
      )}
      {children}
      {source && ( // Output
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: -token.paddingXS,
          }}
        >
          <Handle
            key={source}
            id={source}
            type="source"
            position={Position.Right}
          />
        </div>
      )}
    </div>
  );
}

export default Block;
