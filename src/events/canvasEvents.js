import { updateSelection } from './utils';

// 自动适配视图函数
const fitView = (graph) => {
  const nodes = graph.getNodes();
  if (nodes.length === 0) {
    console.log('[FitView] No nodes found, skipping...');
    return;
  }

  console.log('[FitView] Number of nodes:', nodes.length);
  
  // 打印每个节点的详细信息
  nodes.forEach((node, index) => {
    const model = node.getModel();
    console.log(`[FitView] Node ${index + 1} details:`, {
      id: model.id,
      type: model.type,
      position: { x: model.x, y: model.y },
      size: model.size,
      visible: node.isVisible(),
      destroyed: node.destroyed
    });
  });

  // 使用G6的内置方法进行视图适配
  // padding: [top, right, bottom, left]
  const padding = [100, 150, 100, 150]; // 增加左右边距，确保内容不会突出
  const options = {
    padding,
    limitRatio: 1.5, // 稍微降低最大缩放比例
    align: 'center', // 居中对齐
    adjustView: true, // 自动调整视图
    maxZoom: 1.5, // 限制最大缩放
    minZoom: 0.2, // 限制最小缩放
  };

  console.log('[FitView] Applying G6 fitView with options:', options);
  
  try {
    // 使用G6的fitView方法
    graph.fitView(options);
    console.log('[FitView] G6 fitView applied successfully');
    
    // 获取当前视图状态
    const zoom = graph.getZoom();
    const center = graph.getGraphCenterPoint();
    console.log('[FitView] Current view state:', {
      zoom,
      center: {
        x: center.x.toFixed(2),
        y: center.y.toFixed(2)
      }
    });
  } catch (error) {
    console.error('[FitView] Error applying G6 fitView:', error);
  }
};

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

  // 按下 Escape 键取消当前工具模式，按下空格键自动适配视图
  document.addEventListener('keydown', (e) => {
    // 如果正在输入文本，不处理快捷键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    if (e.key === 'Escape') {
      const currentMode = graph.get('currentMode');
      if (currentMode !== 'default') {
        graph.set('currentMode', 'default');
        // 通知工具栏更新按钮状态
        graph.emit('modeChange', 'default');
      }
    } else if (e.key === ' ' && !e.repeat) { // 防止长按空格重复触发
      e.preventDefault(); // 阻止页面滚动
      fitView(graph);
    }
  });
};