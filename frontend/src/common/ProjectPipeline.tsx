import defaultNodeData from '../component/node/DefaultData';

export type NodeType =
  | 'placeholder'
  | 'imageIngestion'
  | 'imageAugmentation'
  | 'imageClassification'
  | 'storage'
  | 'datasetLoader'
  | 'modelRunner';

export interface ProjectPipelineNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
}

export interface InitializedProjectPipelineNode extends ProjectPipelineNode {
  data: any;
}

export interface ProjectPipelineEdge {
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

export interface InitializedProjectPipelineEdge extends ProjectPipelineEdge {
  id: string;
}

export interface ProjectPipeline {
  projectId: number;
  nodes: ProjectPipelineNode[];
  edges: ProjectPipelineEdge[];
}

export interface InitializedProjectPipeline {
  projectId: number;
  nodes: InitializedProjectPipelineNode[];
  edges: InitializedProjectPipelineEdge[];
}

const placeholderPipelines: ProjectPipeline[] = [
  {
    projectId: 1,
    nodes: [
      { id: '1', type: 'placeholder', position: { x: 400, y: 300 } },
      { id: '2', type: 'imageIngestion', position: { x: 600, y: 500 } },
      { id: '3', type: 'storage', position: { x: 1200, y: 300 } },
    ],
    edges: [
      {
        source: '1',
        target: '3',
        sourceHandle: 'aSource',
        targetHandle: 'dataTarget',
      },
      {
        source: '2',
        target: '3',
        sourceHandle: 'source',
        targetHandle: 'dataTarget',
      },
    ],
  },
  {
    projectId: 2,
    nodes: [
      { id: '4', type: 'datasetLoader', position: { x: 400, y: 300 } },
      { id: '5', type: 'imageAugmentation', position: { x: 900, y: 300 } },
    ],
    edges: [
      {
        source: '4',
        target: '5',
        sourceHandle: 'source',
        targetHandle: 'inputTarget',
      },
    ],
  },
];

// Utility function to simulate delay in API calls
function simulateDelay<T>(data: T, delay: number = 500): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

// Convert the handle ID to backend format
function convertHandleIdToBackend(handleId: string): string {
  return handleId.split('-').slice(1).join('-');
}

// Convert all edges of a pipeline to backend format
function convertPipelineToBackend(pipeline: ProjectPipeline): ProjectPipeline {
  const edges = pipeline.edges.map((edge) => ({
    ...edge,
    sourceHandle: convertHandleIdToBackend(edge.sourceHandle),
    targetHandle: convertHandleIdToBackend(edge.targetHandle),
  }));
  return { ...pipeline, edges };
}

// Convert the handle ID to frontend format
function convertHandleIdToFrontend(type: string, handleId: string): string {
  return `${type}-${handleId}`;
}

// Convert all edges of a pipeline to frontend format
function convertPipelineToFrontend(pipeline: ProjectPipeline): ProjectPipeline {
  const edges = pipeline.edges.map((edge) => ({
    ...edge,
    sourceHandle: convertHandleIdToFrontend(
      pipeline.nodes.find((n) => n.id === edge.source)!.type,
      edge.sourceHandle,
    ),
    targetHandle: convertHandleIdToFrontend(
      pipeline.nodes.find((n) => n.id === edge.target)!.type,
      edge.targetHandle,
    ),
  }));
  return { ...pipeline, edges };
}

// Apply default data for nodes and add ID for edges to the pipeline
export function initializePipeline(
  pipeline: ProjectPipeline,
): InitializedProjectPipeline {
  return {
    ...pipeline,
    nodes: pipeline.nodes.map(
      (node) =>
        ({
          ...node,
          data: defaultNodeData[node.type],
        }) as InitializedProjectPipelineNode,
    ),
    edges: pipeline.edges.map(
      (edge) =>
        ({
          ...edge,
          id: `${edge.source}-${edge.sourceHandle}-${edge.target}-${edge.targetHandle}`,
        }) as InitializedProjectPipelineEdge,
    ),
  };
}

// Retrieve a pipeline for a specific project
export async function getPipeline(
  projectId: number,
): Promise<ProjectPipeline | undefined> {
  const pipeline = placeholderPipelines.find((p) => p.projectId === projectId);
  if (!pipeline) return undefined;
  return simulateDelay(convertPipelineToFrontend(pipeline));
}

// Create/Save a pipeline for a project. If a pipeline exists for the project, it is replaced.
export async function savePipeline(
  pipeline: ProjectPipeline,
): Promise<ProjectPipeline> {
  const index = placeholderPipelines.findIndex(
    (p) => p.projectId === pipeline.projectId,
  );
  if (index > -1) {
    placeholderPipelines[index] = convertPipelineToBackend(pipeline);
  } else {
    placeholderPipelines.push(convertPipelineToBackend(pipeline));
  }
  return simulateDelay(pipeline);
}

// Delete a pipeline for a given project
export async function deletePipeline(projectId: number): Promise<boolean> {
  const index = placeholderPipelines.findIndex(
    (p) => p.projectId === projectId,
  );
  if (index > -1) {
    placeholderPipelines.splice(index, 1);
    return simulateDelay(true);
  }
  return simulateDelay(false);
}
