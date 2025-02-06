import { DatasetLoaderNodeData } from './types/DatasetLoader';
import { ImageAugmentationNodeData } from './types/ImageAugmentation';
import { ImageClassificationModelNodeData } from './types/ImageClassificationModel';
import { ImageIngestionNodeData } from './types/ImageIngestion';
import { ModelRunnerNodeData } from './types/ModelRunner';
import { PlaceholderNodeData } from './types/Placeholder';
import { StorageNodeData } from './types/Storage';

export default {
  placeholder: {
    placeholderA: {
      target: 'default-target-a',
      source: 'default-source-a',
      content: 'Placeholder default content A.',
    },
    placeholderB: {
      target: 'default-target-b',
      content: 'Placeholder default content B.',
    },
    placeholderC: {
      source: 'default-source-c',
      content: 'Placeholder default content C.',
    },
  } as PlaceholderNodeData,
  imageIngestion: {
    source: 'image-ingestion-source',
  } as ImageIngestionNodeData,
  imageAugmentation: {
    parameterTarget: 'image-augmentation-parameter-target',
    inputTarget: 'image-augmentation-input-target',
    outputSource: 'image-augmentation-output-source',
  } as ImageAugmentationNodeData,
  imageClassification: {
    datasetTarget: 'image-classification-dataset-target',
    accuracySource: 'image-classification-accuracy-source',
    modelSource: 'image-classification-model-source',
  } as ImageClassificationModelNodeData,
  storage: {
    dataTarget: 'storage-data-target',
  } as StorageNodeData,
  datasetLoader: {
    source: 'dataset-loader-source',
  } as DatasetLoaderNodeData,
  modelRunner: {
    modelTarget: 'model-runner-model-target',
    inputTarget: 'model-runner-input-target',
    outputSource: 'model-runner-output-source',
  } as ModelRunnerNodeData,
} as { [key: string]: any };
