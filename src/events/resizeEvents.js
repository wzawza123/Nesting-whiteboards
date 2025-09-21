// 处理窗口大小调整事件
const bindWindowResizeEvents = (graph) => {
  window.addEventListener('resize', () => {
    graph.changeSize(window.innerWidth, window.innerHeight);
  });
};

// 处理节点大小调整事件
const bindNodeResizeEvents = (graph) => {
  let isResizing = false;
  let startPoint = null;
  let startSize = null;
  let resizeNode = null;
  let resizeCorner = null;

  // 鼠标按下事件
  graph.on('node:mousedown', (ev) => {
    const node = ev.item;
    const shape = ev.target;
    const shapeName = shape.get('name');

    // 检查是否点击了控制点
    if (shapeName && shapeName.startsWith('control-point-')) {
      const corner = shapeName.split('-')[2]; // 获取控制点位置（nw/ne/se/sw）
      if (['nw', 'ne', 'se', 'sw'].includes(corner)) {
        isResizing = true;
        resizeNode = node;
        resizeCorner = corner;
        startPoint = {
          x: ev.x,
          y: ev.y
        };
        startSize = node.getModel().size || [100, 100];
        graph.set('mode', 'resizing');
      }
    }
  });

  // 鼠标移动事件
  graph.on('canvas:mousemove', (ev) => {
    if (!isResizing || !startPoint || !resizeNode || !startSize) return;

    const dx = ev.x - startPoint.x;
    const dy = ev.y - startPoint.y;
    let newWidth = startSize[0];
    let newHeight = startSize[1];

    // 根据不同的控制点计算新的宽高
    switch (resizeCorner) {
      case 'nw':
        newWidth = Math.max(30, startSize[0] - dx * 2);
        newHeight = Math.max(30, startSize[1] - dy * 2);
        break;
      case 'ne':
        newWidth = Math.max(30, startSize[0] + dx * 2);
        newHeight = Math.max(30, startSize[1] - dy * 2);
        break;
      case 'se':
        newWidth = Math.max(30, startSize[0] + dx * 2);
        newHeight = Math.max(30, startSize[1] + dy * 2);
        break;
      case 'sw':
        newWidth = Math.max(30, startSize[0] - dx * 2);
        newHeight = Math.max(30, startSize[1] + dy * 2);
        break;
    }

    // 保持宽高比
    const aspectRatio = startSize[0] / startSize[1];
    if (newWidth / newHeight !== aspectRatio) {
      if (newWidth / aspectRatio > newHeight) {
        newWidth = newHeight * aspectRatio;
      } else {
        newHeight = newWidth / aspectRatio;
      }
    }

    // 更新节点大小
    graph.updateItem(resizeNode, {
      size: [newWidth, newHeight]
    });
  });

  // 鼠标松开事件
  const handleMouseUp = () => {
    if (isResizing) {
      isResizing = false;
      startPoint = null;
      startSize = null;
      resizeNode = null;
      resizeCorner = null;
      graph.set('mode', 'default');
    }
  };

  graph.on('canvas:mouseup', handleMouseUp);
  graph.on('canvas:mouseleave', handleMouseUp);
};

export const bindResizeEvents = (graph) => {
  bindWindowResizeEvents(graph);
  bindNodeResizeEvents(graph);
};
