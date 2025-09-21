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
      // 不要自动重置模式，让用户可以继续添加节点
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
      // 不要自动重置模式，让用户可以继续添加文本
    } else if (currentMode === 'default') {
      // 清除选择
      updateSelection(graph, null);
      
      // 清除边起始节点
      const edgeStartNode = graph.get('edgeStartNode');
      if (edgeStartNode) {
        graph.setItemState(edgeStartNode, 'selected', false);
        graph.set('edgeStartNode', null);
      }
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

  // 按下 Escape 键取消当前工具模式
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const currentMode = graph.get('currentMode');
      if (currentMode !== 'default') {
        graph.set('currentMode', 'default');
        // 通知工具栏更新按钮状态
        graph.emit('modeChange', 'default');
      }
    }
  });
};