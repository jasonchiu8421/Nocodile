import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, theme } from 'antd';
import { useNavigate } from 'react-router';
import MainScaffold from '../component/MainScaffold';
import { Project, getProjects } from '../common/Project';

function Home() {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      const fetchedProjects = await getProjects();
      setProjects(fetchedProjects);
      setLoading(false);
    }
    loadProjects();
  }, []);

  return (
    <MainScaffold>
      <div style={{ padding: token.paddingLG }}>
        {loading ? (
          <Spin tip="Loading projects..." />
        ) : (
          <Row gutter={[token.marginSM, token.marginSM]}>
            {projects.map((project) => (
              <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
                <Card
                  hoverable
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <Card.Meta title={project.name} />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </MainScaffold>
  );
}

export default Home;
