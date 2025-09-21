// 节点状态样式配置
export const nodeStateStyles = {
  selected: {
    stroke: '#1890ff',
    lineWidth: 2,
    shadowColor: '#1890ff',
    shadowBlur: 10,
  }
};

// 默认节点样式配置
export const defaultNode = {
  type: 'rect',
  style: {
    fill: '#fff',
    stroke: '#333',
    radius: 6,
    lineWidth: 1.5,
  },
  labelCfg: {
    style: {
      fill: '#333',
      fontSize: 16,
      fontFamily: 'Arial',
    },
  },
  size: [160, 80],
};

// 默认边样式配置
export const defaultEdge = {
  type: 'line',
  style: {
    stroke: '#333',
    endArrow: true,
    lineWidth: 1,
  },
  stateStyles: {
    selected: {
      stroke: '#1890ff',
      lineWidth: 2,
      shadowColor: '#1890ff',
      shadowBlur: 10,
    },
  },
};

// 图形配置
export const graphConfig = {
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
  modes: {
    default: [
      'drag-canvas',  // 启用画布拖拽
      'zoom-canvas',  // 启用缩放
      'drag-node',    // 启用节点拖拽
    ],
  },
  nodeStateStyles,
  defaultNode,
  defaultEdge,
};

// 颜色配置
export const colors = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  purple: '#722ed1',
  black: '#333333',
};

// 尺寸配置
export const sizes = {
  controlPoint: 8,
  minNodeSize: 30,
  maxImageSize: 200,
  padding: {
    small: 4,
    medium: 8,
    large: 16,
  },
};

// 样式配置
export const styleConfig = {
  shadowColor: '#1890ff',
  shadowBlur: 10,
  borderRadius: 4,
  fontSize: {
    small: 12,
    medium: 16,
    large: 20,
    extraLarge: 24,
  },
};
