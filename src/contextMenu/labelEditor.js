import { colors } from '../config';

export const startEditingLabel = (item, graph) => {
  const model = item.getModel();
  const currentLabel = model.label || '';
  
  // 获取节点位置和大小
  const nodeBox = item.getBBox();
  const { x, y, width, height } = nodeBox;
  const point = graph.getCanvasByPoint(x, y);
  
  // 计算文本行数来确定textarea高度
  const lines = currentLabel.split('\n');
  const minLines = Math.max(1, lines.length);
  const lineHeight = 20; // 每行高度
  const calculatedHeight = Math.max(height, minLines * lineHeight + 16); // 16px为padding
  
  // 创建textarea元素支持多行文本
  const textarea = document.createElement('textarea');
  textarea.value = currentLabel;
  textarea.className = 'node-editor multiline-editor';
  textarea.style.position = 'absolute';
  textarea.style.width = `${Math.max(120, width + 20)}px`; // 稍微增加宽度
  textarea.style.height = `${calculatedHeight}px`;
  textarea.style.padding = '8px';
  textarea.style.border = `2px solid ${colors.primary}`;
  textarea.style.borderRadius = '4px';
  textarea.style.zIndex = '1000';
  textarea.style.fontSize = '16px';
  textarea.style.backgroundColor = 'white';
  textarea.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  textarea.style.resize = 'both'; // 允许用户调整大小
  textarea.style.minWidth = '120px';
  textarea.style.minHeight = '40px';
  textarea.style.fontFamily = 'Arial, sans-serif';
  textarea.style.lineHeight = '1.2';
  textarea.style.overflow = 'hidden'; // 初始时隐藏滚动条
  
  // 将输入框定位到节点中心
  textarea.style.left = `${point.x - (width + 20)/2}px`;
  textarea.style.top = `${point.y - calculatedHeight/2}px`;
  
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select(); // 选中所有文本以便编辑
  
  // 自动调整textarea高度
  const autoResize = () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(40, textarea.scrollHeight) + 'px';
    textarea.style.overflow = textarea.scrollHeight > textarea.clientHeight ? 'auto' : 'hidden';
  };
  
  // 监听输入事件以自动调整高度
  textarea.addEventListener('input', autoResize);
  
  // 初始调整高度
  setTimeout(autoResize, 0);

  // 处理输入提交
  const handleSubmit = () => {
    const newLabel = textarea.value; // 不要trim，保留用户的换行和空格
    graph.updateItem(item, { label: newLabel });
    document.body.removeChild(textarea);
  };

  // 处理取消操作
  const handleCancel = () => {
    if (document.body.contains(textarea)) {
      document.body.removeChild(textarea);
    }
  };

  // 处理输入事件
  textarea.addEventListener('blur', handleSubmit);
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Enter键完成编辑
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Shift+Enter换行，阻止事件冒泡到document级别
      e.stopPropagation();
    } else if (e.key === 'Escape') {
      // Escape 取消
      e.preventDefault();
      handleCancel();
    }
  });
};
