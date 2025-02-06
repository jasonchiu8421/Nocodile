import React from 'react';
import { Typography } from 'antd';
import { Node, NodeProps } from '@xyflow/react';
import Block from '../Blocks';
import NodeCard from '../Card';

const { Text } = Typography;

type PlaceholderNodeData = {
  placeholderA: { target: string; source: string; content: string };
  placeholderB: { target: string; content: string };
  placeholderC: { source: string; content: string };
};

type PlaceholderNodeType = Node<PlaceholderNodeData, 'placeholder'>;

function PlaceholderNodeContent({ data }: { data: PlaceholderNodeData }) {
  return (
    <NodeCard title="Placeholder">
      <Block
        target={data.placeholderA.target}
        source={data.placeholderA.source}
      >
        <Text>{data.placeholderA.content}</Text>
      </Block>
      <Block target={data.placeholderB.target}>
        <Text>{data.placeholderB.content}</Text>
      </Block>
      <Block source={data.placeholderC.source}>
        <Text>{data.placeholderC.content}</Text>
      </Block>
    </NodeCard>
  );
}

function PlaceholderNode({ data }: NodeProps<PlaceholderNodeType>) {
  return <PlaceholderNodeContent data={data} />;
}

export {
  type PlaceholderNodeData,
  type PlaceholderNodeType,
  PlaceholderNode,
  PlaceholderNodeContent,
};
