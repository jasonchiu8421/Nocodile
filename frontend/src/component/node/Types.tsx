import { DatasetLoaderNode } from './types/DatasetLoader';
import { ImageAugmentationNode } from './types/ImageAugmentation';
import { ImageClassificationModelNode } from './types/ImageClassificationModel';
import { ImageIngestionNode } from './types/ImageIngestion';
import { ModelRunnerNode } from './types/ModelRunner';
import { PlaceholderNode } from './types/Placeholder';
import { StorageNode } from './types/Storage';

export default {
  placeholder: PlaceholderNode,
  imageIngestion: ImageIngestionNode,
  imageAugmentation: ImageAugmentationNode,
  imageClassification: ImageClassificationModelNode,
  storage: StorageNode,
  datasetLoader: DatasetLoaderNode,
  modelRunner: ModelRunnerNode,
};
