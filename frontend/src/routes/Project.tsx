import React, { useCallback, useEffect, useState } from 'react';
import { Flex, List, Spin, Splitter, Typography, theme } from 'antd';
import { useParams } from 'react-router';
import {
  addEdge,
  Background,
  Connection,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import MainScaffold from '../component/MainScaffold';
import consts from '../consts';
import { useTheme } from '../context/Theme';
import DndNode from '../component/DndNode';
import { DndNodeTypeProvider, useDndNodeType } from '../context/DndNodeType';
import defaultNodeData from '../component/node/DefaultData';
import nodeTypes from '../component/node/Types';
import { StorageNodeProvider } from '../context/StorageNode';
import { getProject } from '../common/Project';
import {
  initializePipeline,
  getPipeline as getProjectPipeline,
} from '../common/ProjectPipeline';

const { Title } = Typography;

function ProjectInternal() {
  const { isDarkTheme } = useTheme();
  const { id: projectId } = useParams<{ id: string }>();
  const { token } = theme.useToken();
  const { compactHeaderHeight, nodeGalleryMinWidth } = consts(token);
  const { screenToFlowPosition } = useReactFlow();
  const { dndNodeType } = useDndNodeType();

  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('Loading...');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    async function loadData() {
      if (projectId) {
        const project = await getProject(parseInt(projectId, 10));
        setProjectName(project ? project.name : 'Project not found');

        const pipeline = await getProjectPipeline(parseInt(projectId, 10));
        if (pipeline) {
          const initializedPipeline = initializePipeline(pipeline);

          setNodes(initializedPipeline.nodes as never[]);
          setEdges(initializedPipeline.edges as never[]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [projectId, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    if (params.source === params.target) return;
    setEdges((eds) => addEdge(params, eds));
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (!dndNodeType) return;

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      const type = dndNodeType;
      const data = defaultNodeData[type];

      // There is no need to change any handle's id from the default data.

      const newNode = {
        id: `${type}-${crypto.randomUUID()}`,
        type,
        position,
        data,
      };

      setNodes((nds) => nds.concat(newNode as never));
    },
    [screenToFlowPosition, dndNodeType],
  );

  return (
    <MainScaffold title={projectName} compact>
      <Splitter
        style={{
          height: `calc(100vh - ${compactHeaderHeight}px)`,
        }}
      >
        <Splitter.Panel defaultSize="20%" min="10%">
          <Flex
            vertical
            gap="large"
            style={{
              minWidth: nodeGalleryMinWidth,
              padding: `${token.paddingXS}px ${token.paddingLG}px`,
            }}
          >
            <List
              header={
                <Title level={4} style={{ margin: 0 }}>
                  Node List
                </Title>
              }
              dataSource={Object.keys(nodeTypes)}
              renderItem={(type) => (
                <List.Item style={{ padding: `${token.paddingXS}px 0` }}>
                  <DndNode type={type} />
                </List.Item>
              )}
            />
          </Flex>
        </Splitter.Panel>
        <Splitter.Panel min="10%">
          {loading ? (
            <div
              style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Spin />
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              colorMode={isDarkTheme ? 'dark' : 'light'}
              fitView
            >
              <Controls />
              <Background />
              <MiniMap />
            </ReactFlow>
          )}
        </Splitter.Panel>
      </Splitter>
    </MainScaffold>
  );
}

function Project() {
  return (
    <DndNodeTypeProvider>
      <StorageNodeProvider>
        <ProjectInternal />
      </StorageNodeProvider>
    </DndNodeTypeProvider>
  );
}

export default Project;
