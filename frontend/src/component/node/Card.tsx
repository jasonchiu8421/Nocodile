import React from 'react';
import { Card, Flex, theme } from 'antd';

interface NodeCardProps {
  title: string;
  cover?: React.ReactNode;
  children: React.ReactNode;
}

function NodeCard({ title, cover, children }: NodeCardProps) {
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
      styles={{ body: { padding: 0, maxWidth: 500 }, cover: { maxWidth: 500 } }}
    >
      <Flex
        vertical
        gap="small"
        style={{ padding: `${token.paddingXS}px 0px` }}
      >
        {children}
      </Flex>
    </Card>
  );
}

export default NodeCard;
