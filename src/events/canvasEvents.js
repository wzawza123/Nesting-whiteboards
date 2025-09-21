import { updateSelection } from './utils';

export const bindCanvasEvents = (graph) => {
  // 画布点击事件
  graph.on('canvas:click', (ev) => {
    const currentMode = graph.get('currentMode');
    
    if (currentMode === 'addNode') {
      const point = graph.getPointByClient(ev.clientX, ev.clientY);
      const id = `node-${Date.now()}`;
      graph.addItem('node', {
        id,
        x: point.x,
        y: point.y,
        label: 'Right click to edit',
      });
      graph.set('currentMode', 'default');
    } else if (currentMode === 'addText') {
      const point = graph.getPointByClient(ev.clientX, ev.clientY);
      const id = `text-${Date.now()}`;
      graph.addItem('node', {
        id,
        x: point.x,
        y: point.y,
        label: 'Right click to edit',
        type: 'text-only',
      });
      graph.set('currentMode', 'default');
    }

    // 清除选择
    updateSelection(graph, null);
    
    // 清除边起始节点
    const edgeStartNode = graph.get('edgeStartNode');
    if (edgeStartNode) {
      graph.setItemState(edgeStartNode, 'selected', false);
      graph.set('edgeStartNode', null);
      graph.set('currentMode', 'default');
    }
  });

  // 画布视图变化事件
  graph.on('viewportchange', () => {
    if (graph.get('contextMenu')) {
      graph.get('contextMenu').hide();
    }
  });

  // 拖拽开始事件
  graph.on('dragstart', () => {
    if (graph.get('contextMenu')) {
      graph.get('contextMenu').hide();
    }
  });
};