import React from 'react';
import { Typography, Flex, Button } from 'antd';
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

function ModelRunnerNodeContent({
  data,
  disabled = false,
}: {
  data: ModelRunnerNodeData;
  disabled?: boolean;
}) {
  return (
    <NodeCard title="Model Runner" small>
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
        <Button onClick={() => {}} type="primary" disabled={disabled}>
          Run
        </Button>
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
