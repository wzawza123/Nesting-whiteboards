// 更新选择状态的工具函数
export const updateSelection = (graph, item) => {
  // 清除之前的选择
  const selectedItem = graph.get('selectedItem');
  if (selectedItem) {
    graph.setItemState(selectedItem, 'selected', false);
  }
  
  // 设置新的选择
  if (item) {
    graph.setItemState(item, 'selected', true);
  }
  
  // 更新图的选中项状态
  graph.set('selectedItem', item);
};
