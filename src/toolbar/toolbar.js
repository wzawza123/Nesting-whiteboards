import { createToolbarButtons } from './buttons';

export class Toolbar {
  constructor(graph) {
    this.graph = graph;
    this.toolbar = createToolbarButtons();
    document.body.appendChild(this.toolbar);
    this.bindEvents();
  }

  // 更新按钮激活状态
  updateButtonState(activeMode) {
    // 清除所有按钮的激活状态
    const buttons = ['addRect', 'addText', 'addEdge'];
    buttons.forEach(id => {
      const button = document.getElementById(id);
      if (button) {
        button.classList.remove('active');
      }
    });

    // 设置当前激活按钮的状态
    switch (activeMode) {
      case 'addNode':
        document.getElementById('addRect')?.classList.add('active');
        break;
      case 'addText':
        document.getElementById('addText')?.classList.add('active');
        break;
      case 'addEdge':
        document.getElementById('addEdge')?.classList.add('active');
        break;
    }
  }

  bindEvents() {
    // 添加矩形按钮事件
    document.getElementById('addRect').addEventListener('click', () => {
      const currentMode = this.graph.get('currentMode');
      const newMode = currentMode === 'addNode' ? 'default' : 'addNode';
      this.graph.set('currentMode', newMode);
      this.updateButtonState(newMode);
    });

    // 添加文本按钮事件
    document.getElementById('addText').addEventListener('click', () => {
      const currentMode = this.graph.get('currentMode');
      const newMode = currentMode === 'addText' ? 'default' : 'addText';
      this.graph.set('currentMode', newMode);
      this.updateButtonState(newMode);
    });

    // 添加箭头按钮事件
    document.getElementById('addEdge').addEventListener('click', () => {
      const currentMode = this.graph.get('currentMode');
      const newMode = currentMode === 'addEdge' ? 'default' : 'addEdge';
      this.graph.set('currentMode', newMode);
      // 清除可能存在的边起始节点
      if (newMode === 'default') {
        const edgeStartNode = this.graph.get('edgeStartNode');
        if (edgeStartNode) {
          this.graph.setItemState(edgeStartNode, 'selected', false);
          this.graph.set('edgeStartNode', null);
        }
      }
      this.updateButtonState(newMode);
    });

    // 删除按钮事件
    document.getElementById('delete').addEventListener('click', () => {
      const selectedItem = this.graph.get('selectedItem');
      if (selectedItem) {
        this.graph.removeItem(selectedItem);
        this.graph.set('selectedItem', null);
      }
    });

    // 保存按钮事件
    document.getElementById('saveGraph').addEventListener('click', () => {
      this.graph.emit('saveGraph');
    });

    // 加载按钮事件
    document.getElementById('loadGraph').addEventListener('click', () => {
      document.getElementById('loadFile').click();
    });

    // 文件输入框变化事件
    document.getElementById('loadFile').addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        this.graph.emit('loadGraph', file);
        event.target.value = '';
      }
    });

    // 监听模式变化事件
    this.graph.on('modeChange', (mode) => {
      this.updateButtonState(mode);
    });
  }
}