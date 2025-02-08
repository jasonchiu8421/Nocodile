import { DatasetLoaderNodeData } from './types/DatasetLoader';
import { ImageAugmentationNodeData } from './types/ImageAugmentation';
import { ImageClassificationModelNodeData } from './types/ImageClassificationModel';
import { ImageIngestionNodeData } from './types/ImageIngestion';
import { ModelRunnerNodeData } from './types/ModelRunner';
import { PlaceholderNodeData } from './types/Placeholder';
import { StorageNodeData } from './types/Storage';

export default {
  placeholder: {
    aTarget: 'placeholder-aTarget',
    aSource: 'placeholder-aSource',
    aContent: 'placeholder-aContent',
    bTarget: 'placeholder-bTarget',
    bContent: 'placeholder-bContent',
    cSource: 'placeholder-cSource',
    cContent: 'placeholder-cContent',
  } as PlaceholderNodeData,
  imageIngestion: {
    source: 'imageIngestion-source',
  } as ImageIngestionNodeData,
  imageAugmentation: {
    parameterTarget: 'imageAugmentation-parameterTarget',
    inputTarget: 'imageAugmentation-inputTarget',
    outputSource: 'imageAugmentation-outputSource',
  } as ImageAugmentationNodeData,
  imageClassification: {
    datasetTarget: 'imageClassification-datasetTarget',
    accuracySource: 'imageClassification-accuracySource',
    modelSource: 'imageClassification-modelSource',
  } as ImageClassificationModelNodeData,
  storage: {
    dataTarget: 'storage-dataTarget',
  } as StorageNodeData,
  datasetLoader: {
    source: 'datasetLoader-source',
  } as DatasetLoaderNodeData,
  modelRunner: {
    modelTarget: 'modelRunner-modelTarget',
    inputTarget: 'modelRunner-inputTarget',
    outputSource: 'modelRunner-outputSource',
  } as ModelRunnerNodeData,
} as { [key: string]: any };
