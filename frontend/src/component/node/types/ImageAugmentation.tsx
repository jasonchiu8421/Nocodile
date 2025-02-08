import React, { useState, useEffect } from 'react';
import {
  Typography,
  Image,
  theme,
  Slider,
  Select,
  InputNumber,
  Flex,
} from 'antd';
import { Node, NodeProps } from '@xyflow/react';
import Block from '../Blocks';
import NodeCard from '../Card';

const { Text } = Typography;

interface ImageData {
  uid: string;
  url: string;
}

type ImageAugmentationNodeData = {
  parameterTarget: string;
  inputTarget: string;
  outputSource: string;
};

type ImageAugmentationNodeType = Node<
  ImageAugmentationNodeData,
  'imageAugmentation'
>;

enum ParameterType {
  SLIDER = 'slider',
  NUMBER = 'number',
}

function ImageAugmentationNodeContent({
  data,
  disabled = false,
}: {
  data: ImageAugmentationNodeData;
  disabled?: boolean;
}) {
  const { token } = theme.useToken();
  const [parameter, setParameter] = useState(50);
  const [parameterType, setParameterType] = useState<ParameterType | null>(
    null,
  );
  const [images, setImages] = useState<ImageData[]>([]);

  useEffect(() => {
    const randomCount = Math.floor(Math.random() * 5) + 1;
    const newImages = Array.from({ length: randomCount }, () => ({
      uid: crypto.randomUUID(),
      url: `https://picsum.photos/300/200`,
    }));
    setImages(newImages);
  }, []);

  return (
    <NodeCard
      title="Image Augmentation"
      cover={
        !disabled && images[0]?.url ? (
          <div
            style={{
              overflow: 'hidden',
              width: 'fit-content',
              height: 'fit-content',
              borderRadius: `${token.borderRadiusLG}px`,
            }}
          >
            <Image
              alt="augmented-image"
              src={images[0].url}
              preview={false}
              height={150}
            />
          </div>
        ) : (
          <div
            style={{
              height: 150,
              background: token.colorBgContainer,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text type="secondary">No Image</Text>
          </div>
        )
      }
    >
      <Block target={data.parameterTarget}>
        <Flex gap="small" wrap align="center">
          <Select
            value={parameterType}
            onChange={setParameterType}
            placeholder="Select a parameter type"
            options={[
              { label: 'Slider', value: ParameterType.SLIDER },
              { label: 'Number', value: ParameterType.NUMBER },
            ]}
            style={{ width: 120 }}
            disabled={disabled}
            className="nodrag"
          />
          {parameterType && (
            <div style={{ minWidth: 100, flex: 1 }}>
              {parameterType === ParameterType.SLIDER ? (
                <Slider
                  value={parameter}
                  onChange={setParameter}
                  disabled={disabled}
                  className="nodrag"
                />
              ) : (
                <InputNumber
                  value={parameter}
                  onChange={(value) => setParameter(value ?? parameter)}
                  disabled={disabled}
                  className="nodrag"
                  style={{ width: '100%' }}
                />
              )}
            </div>
          )}
        </Flex>
      </Block>

      <Block target={data.inputTarget} source={data.outputSource}>
        <Flex justify="space-between" align="center">
          <Text>Input</Text>
          <Text>Output</Text>
        </Flex>
      </Block>
    </NodeCard>
  );
}

function ImageAugmentationNode({ data }: NodeProps<ImageAugmentationNodeType>) {
  return <ImageAugmentationNodeContent data={data} />;
}

export {
  type ImageAugmentationNodeData,
  type ImageAugmentationNodeType,
  ImageAugmentationNode,
  ImageAugmentationNodeContent,
};
