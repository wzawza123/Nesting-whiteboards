// 创建工具栏按钮
export const createToolbarButtons = () => {
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  
  // 添加矩形按钮
  const addRectBtn = document.createElement('button');
  addRectBtn.id = 'addRect';
  addRectBtn.textContent = 'Add Rectangle';
  toolbar.appendChild(addRectBtn);
  
  // 添加文本按钮
  const addTextBtn = document.createElement('button');
  addTextBtn.id = 'addText';
  addTextBtn.textContent = 'Add Text';
  toolbar.appendChild(addTextBtn);
  
  // 添加箭头按钮
  const addEdgeBtn = document.createElement('button');
  addEdgeBtn.id = 'addEdge';
  addEdgeBtn.textContent = 'Add Arrow';
  toolbar.appendChild(addEdgeBtn);
  
  // 添加删除按钮
  const deleteBtn = document.createElement('button');
  deleteBtn.id = 'delete';
  deleteBtn.textContent = 'Delete Selected';
  toolbar.appendChild(deleteBtn);
  
  // 添加分隔符
  const separator = document.createElement('div');
  separator.className = 'separator';
  toolbar.appendChild(separator);
  
  // 添加保存按钮
  const saveBtn = document.createElement('button');
  saveBtn.id = 'saveGraph';
  saveBtn.textContent = 'Save';
  toolbar.appendChild(saveBtn);
  
  // 添加加载按钮
  const loadBtn = document.createElement('button');
  loadBtn.id = 'loadGraph';
  loadBtn.textContent = 'Load';
  toolbar.appendChild(loadBtn);
  
  // 添加文件输入框（隐藏）
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'loadFile';
  fileInput.style.display = 'none';
  fileInput.accept = '.json';
  toolbar.appendChild(fileInput);
  
  return toolbar;
};
