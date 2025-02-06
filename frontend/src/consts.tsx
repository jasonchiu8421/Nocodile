import { GlobalToken } from 'antd';

function consts(token: GlobalToken) {
  return {
    compactHeaderHeight: token.controlHeight + token.padding,
    nodeGalleryMinWidth: token.sizeXXL * 4,
  };
}

export default consts;
