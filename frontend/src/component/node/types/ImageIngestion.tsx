import React, { useState } from 'react';
import {
  Upload,
  Button,
  Typography,
  Image,
  theme,
  Flex,
  UploadFile,
  Collapse,
} from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { Node, NodeProps } from '@xyflow/react';
import Block from '../Blocks';
import NodeCard from '../Card';

const { Text } = Typography;

type ImageIngestionNodeData = {
  source: string;
};

type ImageIngestionNodeType = Node<ImageIngestionNodeData, 'imageIngestion'>;

function ImageIngestionNodeContent({
  data,
  disabled = false,
}: {
  data: ImageIngestionNodeData;
  disabled?: boolean;
}) {
  const { token } = theme.useToken();
  const [images, setImages] = useState<UploadFile[]>([]);

  const handleUpload = (file: File) => {
    const uid = crypto.randomUUID();
    const newImageUploading: UploadFile = {
      uid,
      name: file.name,
      url: URL.createObjectURL(file),
      status: 'uploading',
    };
    setImages((prev) => [...prev, newImageUploading]);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const newImageDone: UploadFile = {
        uid,
        name: file.name,
        status: 'done',
        url: reader.result as string,
      };
      setImages((prev) =>
        prev.map((image) => (image.uid === uid ? newImageDone : image)),
      );
    };
    return false;
  };

  const handleRemove = (file: UploadFile<ImageData>) => {
    setImages((prev) => prev.filter((image) => image.uid !== file.uid));
  };

  return (
    <NodeCard
      title="Image Ingestion"
      cover={
        images[0]?.url ? (
          <div
            style={{
              overflow: 'hidden',
              width: 'fit-content',
              height: 'fit-content',
              borderRadius: `${token.borderRadiusLG}px`,
            }}
          >
            <Image
              alt="first-image"
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
            <Text type="secondary">No Image Uploaded</Text>
          </div>
        )
      }
    >
      <Block source={data.source}>
        <Flex gap="small" wrap align="center">
          <Upload
            multiple
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleUpload} // TODO: remove this and use action instead.
            disabled={disabled}
            defaultFileList={images}
          >
            <Button icon={<UploadOutlined />}>Upload Images</Button>
          </Upload>
          <Button
            icon={<DeleteOutlined />}
            onClick={() => setImages([])}
            disabled={images.length === 0}
            danger
          >
            Clear
          </Button>
          <Text type="secondary">
            {images.length > 0 ? `${images.length} Images` : 'No Images'}
          </Text>
        </Flex>
      </Block>
      {images.length > 0 && (
        <Collapse bordered={false} style={{ background: 'none' }}>
          <Collapse.Panel header="View Images" key="1">
            <div
              style={{
                maxHeight: 300,
                overflowY: 'auto',
                paddingRight: token.paddingXS,
              }}
              className="nodrag"
            >
              <Flex vertical gap="small">
                {images.map((image) => (
                  <Flex
                    key={image.uid}
                    justify="space-between"
                    align="center"
                    gap="small"
                    style={{
                      padding: token.paddingXS,
                      border: `1px solid ${token.colorBorder}`,
                      borderRadius: token.borderRadiusLG,
                    }}
                  >
                    <Flex align="center" gap="small">
                      <Text ellipsis>{image.name}</Text>
                    </Flex>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemove(image)}
                      disabled={disabled}
                    />
                  </Flex>
                ))}
              </Flex>
            </div>
          </Collapse.Panel>
        </Collapse>
      )}
    </NodeCard>
  );
}

function ImageIngestionNode({ data }: NodeProps<ImageIngestionNodeType>) {
  return <ImageIngestionNodeContent data={data} />;
}

export {
  type ImageIngestionNodeData,
  type ImageIngestionNodeType,
  ImageIngestionNode,
  ImageIngestionNodeContent,
};
