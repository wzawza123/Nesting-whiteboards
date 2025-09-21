import { colors } from '../config';

export const startEditingLabel = (item, graph) => {
  const model = item.getModel();
  const currentLabel = model.label || '';
  
  // 获取节点位置和大小
  const nodeBox = item.getBBox();
  const { x, y, width, height } = nodeBox;
  const point = graph.getCanvasByPoint(x, y);
  
  // 创建输入元素
  const input = document.createElement('input');
  input.value = currentLabel;
  input.className = 'node-editor';
  input.style.position = 'absolute';
  input.style.width = `${Math.max(120, width)}px`;
  input.style.padding = '4px 8px';
  input.style.border = `2px solid ${colors.primary}`;
  input.style.borderRadius = '4px';
  input.style.zIndex = '1000';
  input.style.fontSize = '16px';
  input.style.backgroundColor = 'white';
  input.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  
  // 将输入框定位到节点中心
  input.style.left = `${point.x - width/2}px`;
  input.style.top = `${point.y - height/2}px`;
  
  document.body.appendChild(input);
  input.focus();
  input.select(); // 选中所有文本以便编辑

  // 处理输入提交
  const handleSubmit = () => {
    const newLabel = input.value.trim();
    if (newLabel) {
      graph.updateItem(item, { label: newLabel });
    }
    document.body.removeChild(input);
  };

  // 处理输入事件
  input.addEventListener('blur', handleSubmit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      document.body.removeChild(input);
    }
  });
};
