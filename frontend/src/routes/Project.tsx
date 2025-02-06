import React, { useCallback } from 'react';
import { Flex, List, Splitter, Typography, theme } from 'antd';
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

const { Title } = Typography;

let id = 1;
function getId() {
  id += 1;
  return `${id}`;
}

function ProjectInternal() {
  const { isDarkTheme } = useTheme();
  const { token } = theme.useToken();
  const { compactHeaderHeight, nodeGalleryMinWidth } = consts(token);
  const { screenToFlowPosition } = useReactFlow();
  const { dndNodeType } = useDndNodeType();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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
      const type = dndNodeType!;
      const data = defaultNodeData[type];

      const newNode = {
        id: getId(),
        type,
        position,
        data,
      };

      setNodes((nds) => nds.concat(newNode as never));
    },
    [screenToFlowPosition, dndNodeType],
  );

  return (
    <MainScaffold title="Placeholder Project Name" compact>
      <Splitter
        style={{
          height: `calc(100vh - ${compactHeaderHeight}px`,
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
            style={{ backgroundColor: '#F7F9FB' }}
          >
            <Controls />
            <Background />
            <MiniMap />
          </ReactFlow>
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
