import React from 'react';
import { Card, Row, Col, theme } from 'antd';
import { useNavigate } from 'react-router';
import { placeholderProjects } from '../common/Project';
import MainScaffold from '../component/MainScaffold';

function Home() {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  return (
    <MainScaffold>
      <div style={{ padding: token.paddingLG }}>
        <Row gutter={[token.marginSM, token.marginSM]}>
          {placeholderProjects.map((project) => (
            <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
              <Card
                hoverable
                cover={<img alt={project.name} src={project.thumbnail} />}
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <Card.Meta title={project.name} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </MainScaffold>
  );
}

export default Home;
