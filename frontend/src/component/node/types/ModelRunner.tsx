import React from 'react';
import { Typography, Flex } from 'antd';
import { Node, NodeProps } from '@xyflow/react';
import Block from '../Blocks';
import NodeCard from '../Card';

const { Text } = Typography;

type ModelRunnerNodeData = {
  modelTarget: string;
  inputTarget: string;
  outputSource: string;
};

type ModelRunnerNodeType = Node<ModelRunnerNodeData, 'modelRunner'>;

function ModelRunnerNodeContent({ data }: { data: ModelRunnerNodeData }) {
  return (
    <NodeCard title="Model Runner">
      <Flex vertical gap="small">
        <Block target={data.modelTarget}>
          <Flex align="start">
            <Text>Trained Model</Text>
          </Flex>
        </Block>

        <Block target={data.inputTarget} source={data.outputSource}>
          <Flex justify="space-between" align="center">
            <Text>Input</Text>
            <Text>Output</Text>
          </Flex>
        </Block>
      </Flex>
    </NodeCard>
  );
}

function ModelRunnerNode({ data }: NodeProps<ModelRunnerNodeType>) {
  return <ModelRunnerNodeContent data={data} />;
}

export {
  type ModelRunnerNodeData,
  type ModelRunnerNodeType,
  ModelRunnerNode,
  ModelRunnerNodeContent,
};
