// 处理窗口大小调整事件
export const bindResizeEvents = (graph) => {
  window.addEventListener('resize', () => {
    graph.changeSize(window.innerWidth, window.innerHeight);
  });
};
