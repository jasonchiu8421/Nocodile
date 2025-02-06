import React from 'react';
import { Layout, Switch, Button, Typography, theme, Flex, Menu } from 'antd';
import { UserOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router';
import { useTheme } from '../context/Theme';
import consts from '../consts';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

interface MainScaffoldProps {
  children: React.ReactNode;
  title?: string;
  compact?: boolean;
}

function MainScaffold({
  children,
  title = 'Project Assemble',
  compact = false,
}: MainScaffoldProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkTheme, toggleTheme } = useTheme();
  const { token } = theme.useToken();
  const { compactHeaderHeight } = consts(token);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          height: compact ? compactHeaderHeight : undefined,
          lineHeight: compact ? `${compactHeaderHeight}px` : undefined,
        }}
      >
        <Flex align="center" gap="middle" flex={1}>
          <Title
            level={compact ? 4 : 3}
            style={{ color: token.colorText, margin: 0 }}
          >
            {title}
          </Title>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={[{ key: '/home', label: 'Home' }]}
            onClick={({ key }) => navigate(key)}
            style={{ flex: 1, border: 'none' }}
          />
        </Flex>
        <Flex align="center" gap="middle">
          <Switch
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            checked={isDarkTheme}
            onChange={toggleTheme}
            style={{
              backgroundColor: isDarkTheme ? '#177ddc' : '#faad14',
            }}
          />
          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={() => navigate('/account')}
          >
            Account
          </Button>
        </Flex>
      </Header>

      <Content>{children}</Content>

      {!compact && (
        <Footer style={{ textAlign: 'center' }}>
          <Title level={5}>Project Assemble</Title>
          <div>Copyright © {new Date().getFullYear()} All rights reserved</div>
        </Footer>
      )}
    </Layout>
  );
}

export default MainScaffold;
