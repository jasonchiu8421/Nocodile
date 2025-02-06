import React from 'react';
import { useDndNodeType } from '../context/DndNodeType';
import { PlaceholderNodeContent } from './node/types/Placeholder';
import defaultNodeData from './node/DefaultData';
import { ImageIngestionNodeContent } from './node/types/ImageIngestion';
import { ImageAugmentationNodeContent } from './node/types/ImageAugmentation';
import { ImageClassificationModelNodeContent } from './node/types/ImageClassificationModel';
import { StorageNodeContent } from './node/types/Storage';
import { DatasetLoaderNodeContent } from './node/types/DatasetLoader';
import { ModelRunnerNodeContent } from './node/types/ModelRunner';

interface DndNodeProps {
  type: string;
}

function DndNode({ type }: DndNodeProps) {
  const { setDndNodeType } = useDndNodeType();

  const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    setDndNodeType(type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const componentMap: { [key: string]: React.ReactElement } = {
    placeholder: <PlaceholderNodeContent data={defaultNodeData.placeholder} />,
    imageIngestion: (
      <ImageIngestionNodeContent
        data={defaultNodeData.imageIngestion}
        disabled
      />
    ),
    imageAugmentation: (
      <ImageAugmentationNodeContent
        data={defaultNodeData.imageAugmentation}
        disabled
      />
    ),
    imageClassification: (
      <ImageClassificationModelNodeContent
        data={defaultNodeData.imageClassification}
        disabled
      />
    ),
    storage: <StorageNodeContent data={defaultNodeData.storage} disabled />,
    datasetLoader: (
      <DatasetLoaderNodeContent data={defaultNodeData.datasetLoader} disabled />
    ),
    modelRunner: <ModelRunnerNodeContent data={defaultNodeData.modelRunner} />,
  };

  return (
    <div draggable onDragStart={onDragStart}>
      {componentMap[type]}
    </div>
  );
}

export default DndNode;
