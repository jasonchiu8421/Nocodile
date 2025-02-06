import React, { useState } from 'react';
import { Upload, Button, Typography, Flex } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { Node, NodeProps } from '@xyflow/react';
import Block from '../Blocks';
import NodeCard from '../Card';

const { Text } = Typography;

type DatasetLoaderNodeData = {
  source: string;
};

type DatasetLoaderNodeType = Node<DatasetLoaderNodeData, 'datasetLoader'>;

function DatasetLoaderNodeContent({
  data,
  disabled = false,
}: {
  data: DatasetLoaderNodeData;
  disabled?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = (uploadFile: File) => {
    setFile(uploadFile);
    return false;
  };

  return (
    <NodeCard title="Dataset Loader">
      <Block source={data.source}>
        <Flex gap="small" wrap align="center">
          <Upload
            accept="*/*"
            showUploadList={false}
            beforeUpload={handleUpload}
            disabled={disabled}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Upload Dataset</Button>
          </Upload>
          {file && (
            <>
              <Button
                icon={<DeleteOutlined />}
                onClick={() => setFile(null)}
                danger
              >
                Clear
              </Button>
              <Text type="secondary">{file.name}</Text>
            </>
          )}
        </Flex>
      </Block>
    </NodeCard>
  );
}

function DatasetLoaderNode({ data }: NodeProps<DatasetLoaderNodeType>) {
  return <DatasetLoaderNodeContent data={data} />;
}

export {
  type DatasetLoaderNodeData,
  type DatasetLoaderNodeType,
  DatasetLoaderNode,
  DatasetLoaderNodeContent,
};
