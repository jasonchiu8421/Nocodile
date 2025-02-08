import React from 'react';
import { Typography } from 'antd';
import { Node, NodeProps } from '@xyflow/react';
import Block from '../Blocks';
import NodeCard from '../Card';

const { Text } = Typography;

type PlaceholderNodeData = {
  aTarget: string;
  aSource: string;
  aContent: string;
  bTarget: string;
  bContent: string;
  cSource: string;
  cContent: string;
};

type PlaceholderNodeType = Node<PlaceholderNodeData, 'placeholder'>;

function PlaceholderNodeContent({ data }: { data: PlaceholderNodeData }) {
  return (
    <NodeCard title="Placeholder" small>
      <Block target={data.aTarget} source={data.aSource}>
        <Text>{data.aContent}</Text>
      </Block>
      <Block target={data.bTarget}>
        <Text>{data.bContent}</Text>
      </Block>
      <Block source={data.cSource}>
        <Text>{data.cContent}</Text>
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
