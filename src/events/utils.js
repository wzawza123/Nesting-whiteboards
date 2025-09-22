// 更新选择状态的工具函数
export const updateSelection = (graph, item) => {
  // 清除之前的选择
  const selectedItem = graph.get('selectedItem');
  if (selectedItem) {
    try {
      // 尝试清除选中状态，如果节点已被删除会抛出异常
      graph.setItemState(selectedItem, 'selected', false);
    } catch (error) {
      // 如果节点已被删除或销毁，忽略错误
      console.warn('清除已删除节点的选中状态时出错:', error);
    }
  }
  
  // 设置新的选择
  if (item) {
    try {
      graph.setItemState(item, 'selected', true);
    } catch (error) {
      console.warn('设置新节点选中状态时出错:', error);
    }
  }
  
  // 更新图的选中项状态
  graph.set('selectedItem', item);
};


