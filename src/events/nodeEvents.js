import { sizes } from '../config';
import { updateSelection } from './utils';

// 跟踪鼠标位置和调整大小状态
let mousePosition = { x: 0, y: 0 };
let isResizing = false;
let resizeNode = null;
let resizeStartSize = null;
let resizeStartPoint = null;
let resizeHandle = null;

export const bindNodeEvents = (graph) => {
  // 节点点击事件
  graph.on('node:click', (ev) => {
    const node = ev.item;
    const currentMode = graph.get('currentMode');
    const edgeStartNode = graph.get('edgeStartNode');
    
    if (currentMode === 'addEdge') {
      if (!edgeStartNode) {
        graph.set('edgeStartNode', node);
        graph.setItemState(node, 'selected', true);
      } else {
        // 检查是否点击了同一个节点
        if (edgeStartNode.get('id') !== node.get('id')) {
          const id = `edge-${Date.now()}`;
          graph.addItem('edge', {
            id,
            source: edgeStartNode.get('id'),
            target: node.get('id'),
          });
        }
        // 清除起始节点的选择状态
        graph.setItemState(edgeStartNode, 'selected', false);
        graph.set('edgeStartNode', null);
        graph.set('currentMode', 'default');
      }
    }
    updateSelection(graph, node);
  });

  // 节点双击事件
  graph.on('node:dblclick', (ev) => {
    const node = ev.item;
    const model = node.getModel();
    
    // 只处理矩形节点
    if (model.type === 'text-only') return;
    
    // 触发进入子图事件
    graph.emit('enterSubgraph', node);
  });

  // 节点右键菜单
  graph.on('node:contextmenu', (ev) => {
    ev.preventDefault();
    const { item, clientX, clientY } = ev;
    const contextMenu = graph.get('contextMenu');
    if (contextMenu) {
      contextMenu.show(clientX, clientY, item);
    }
  });

  // 节点鼠标按下事件（用于调整大小）
  graph.on('node:mousedown', (ev) => {
    const { item, target } = ev;
    const name = target.get('name');
    
    if (name && name.startsWith('control-point-')) {
      isResizing = true;
      resizeNode = item;
      resizeStartSize = item.getModel().size || [100, 100];
      resizeStartPoint = { ...mousePosition };
      resizeHandle = name.split('-')[2]; // 获取控制点位置 (nw, ne, se, sw)
      ev.preventDefault();
    }
  });
};

// 处理鼠标移动事件
export const handleMouseMove = (graph, ev) => {
  const containerRect = graph.get('container').getBoundingClientRect();
  const point = {
    x: ev.clientX - containerRect.left,
    y: ev.clientY - containerRect.top
  };
  mousePosition = graph.getPointByClient(point.x, point.y);

  // 处理调整大小
  if (isResizing && resizeNode) {
    const dx = mousePosition.x - resizeStartPoint.x;
    const dy = mousePosition.y - resizeStartPoint.y;
    let newWidth = resizeStartSize[0];
    let newHeight = resizeStartSize[1];

    // 根据控制点计算新的大小
    switch (resizeHandle) {
      case 'nw':
        newWidth = resizeStartSize[0] - dx * 2;
        newHeight = resizeStartSize[1] - dy * 2;
        break;
      case 'ne':
        newWidth = resizeStartSize[0] + dx * 2;
        newHeight = resizeStartSize[1] - dy * 2;
        break;
      case 'se':
        newWidth = resizeStartSize[0] + dx * 2;
        newHeight = resizeStartSize[1] + dy * 2;
        break;
      case 'sw':
        newWidth = resizeStartSize[0] - dx * 2;
        newHeight = resizeStartSize[1] + dy * 2;
        break;
    }

    // 确保最小尺寸
    newWidth = Math.max(sizes.minNodeSize, newWidth);
    newHeight = Math.max(sizes.minNodeSize, newHeight);

    // 更新节点大小
    graph.updateItem(resizeNode, {
      size: [newWidth, newHeight]
    });
  }
};

// 处理鼠标抬起事件
export const handleMouseUp = () => {
  isResizing = false;
  resizeNode = null;
  resizeStartSize = null;
  resizeStartPoint = null;
  resizeHandle = null;
};