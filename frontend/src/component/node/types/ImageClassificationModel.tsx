import React, { useState } from 'react';
import { Typography, Select, Flex, Button } from 'antd';
import { Node, NodeProps } from '@xyflow/react';
import Block from '../Blocks';
import NodeCard from '../Card';

const { Text } = Typography;

enum ModelType {
  DIGIT_RECOGNIZER = 'digitRecognizer',
}

type ImageClassificationModelNodeData = {
  datasetTarget: string;
  accuracySource: string;
  modelSource: string;
};

type ImageClassificationModelNodeType = Node<
  ImageClassificationModelNodeData,
  'imageClassificationModel'
>;

function ImageClassificationModelNodeContent({
  data,
  disabled = false,
}: {
  data: ImageClassificationModelNodeData;
  disabled?: boolean;
}) {
  const [model, setModel] = useState<ModelType | null>(null);

  return (
    <NodeCard title="Image Classification Model">
      <Flex vertical gap="small">
        <Select
          value={model}
          onChange={setModel}
          placeholder="Select a model"
          options={[
            { label: 'Digit Recognizer', value: ModelType.DIGIT_RECOGNIZER },
          ]}
          disabled={disabled}
          style={{ width: '100%' }}
          className="nodrag"
        />
        <Button onClick={() => {}} type="primary" disabled={disabled}>
          Train
        </Button>
        <Block target={data.datasetTarget} source={data.accuracySource}>
          <Flex justify="space-between" align="center">
            <Text>Dataset</Text>
            <Text>Accuracy</Text>
          </Flex>
        </Block>
        <Block source={data.modelSource}>
          <Flex justify="end">
            <Text>Trained Model</Text>
          </Flex>
        </Block>
      </Flex>
    </NodeCard>
  );
}

function ImageClassificationModelNode({
  data,
}: NodeProps<ImageClassificationModelNodeType>) {
  return <ImageClassificationModelNodeContent data={data} />;
}

export {
  type ImageClassificationModelNodeData,
  type ImageClassificationModelNodeType,
  ImageClassificationModelNode,
  ImageClassificationModelNodeContent,
};
