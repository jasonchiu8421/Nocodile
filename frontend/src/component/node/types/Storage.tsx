import React, { useState } from 'react';
import { Typography, Input, theme, Flex } from 'antd';
import { Node, NodeProps } from '@xyflow/react';
import Block from '../Blocks';
import NodeCard from '../Card';
import { useStorageNode } from '../../../context/StorageNode';

const { Text } = Typography;

type StorageNodeData = {
  dataTarget: string;
};

type StorageNodeType = Node<StorageNodeData, 'storage'>;

function StorageNodeContent({
  data,
  disabled = false,
}: {
  data: StorageNodeData;
  disabled?: boolean;
}) {
  const { token } = theme.useToken();
  const [id, setId] = useState<string>('');
  const { getStorageValue } = useStorageNode();
  const storedValue = getStorageValue(id);

  return (
    <NodeCard title="Storage">
      <Flex vertical gap="small">
        <div style={{ padding: `0px ${token.paddingXS}px` }}>
          <Input
            placeholder="Enter ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={disabled}
            className="nodrag"
          />
        </div>

        <Block target={data.dataTarget}>
          <Flex justify="space-between" align="center">
            <Text>Data</Text>
            {storedValue ? (
              <Text type="secondary">{JSON.stringify(storedValue)}</Text>
            ) : (
              <Text type="secondary" italic>
                No data
              </Text>
            )}
          </Flex>
        </Block>
      </Flex>
    </NodeCard>
  );
}

function StorageNode({ data }: NodeProps<StorageNodeType>) {
  return <StorageNodeContent data={data} />;
}

export {
  type StorageNodeData,
  type StorageNodeType,
  StorageNode,
  StorageNodeContent,
};
