import React from 'react';
import { Card, Flex, theme } from 'antd';

interface NodeCardProps {
  title: string;
  cover?: React.ReactNode;
  small?: boolean;
  children: React.ReactNode;
}

function NodeCard({ title, cover, small = false, children }: NodeCardProps) {
  const { token } = theme.useToken();

  return (
    <Card
      size="small"
      title={title}
      cover={
        cover && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: token.paddingXS,
              width: '100%',
            }}
          >
            {cover}
          </div>
        )
      }
      hoverable
      style={{ minWidth: small ? 150 : 300 }}
      styles={{ body: { padding: 0 }, cover: { maxWidth: 500 } }}
    >
      <Flex vertical gap="small" style={{ padding: token.paddingXS }}>
        {children}
      </Flex>
    </Card>
  );
}

export default NodeCard;
