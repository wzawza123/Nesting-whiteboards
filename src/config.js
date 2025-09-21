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
    radius: 8,  // 稍微增大圆角
    lineWidth: 1.5,
  },
  labelCfg: {
    style: {
      fill: '#333',
      fontSize: 20,
      fontFamily: 'Arial',
    },
  },
  size: [200, 100],  // 增大默认矩形大小，从 [160, 80] 改为 [200, 100]
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
  controlPoint: 10,  // 增大控制点大小
  minNodeSize: 50,   // 增大最小节点大小
  maxImageSize: 250, // 增大最大图片大小
  padding: {
    small: 6,
    medium: 12,
    large: 24,
  },
};

// 样式配置
export const styleConfig = {
  shadowColor: '#1890ff',
  shadowBlur: 10,
  borderRadius: 4,
  fontSize: {
    small: 16,
    medium: 20,
    large: 24,
    extraLarge: 28,
  },
};