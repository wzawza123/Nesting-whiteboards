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

  // 处理工具模式切换
  toggleToolMode(mode) {
    const currentMode = this.graph.get('currentMode');
    const newMode = currentMode === mode ? 'default' : mode;
    this.graph.set('currentMode', newMode);
    
    // 如果切换到默认模式，清除边起始节点
    if (newMode === 'default') {
      const edgeStartNode = this.graph.get('edgeStartNode');
      if (edgeStartNode) {
        this.graph.setItemState(edgeStartNode, 'selected', false);
        this.graph.set('edgeStartNode', null);
      }
    }
    
    this.updateButtonState(newMode);
  }

  // 删除选中的元素
  deleteSelectedItem() {
    const selectedItem = this.graph.get('selectedItem');
    if (selectedItem) {
      this.graph.removeItem(selectedItem);
      this.graph.set('selectedItem', null);
    }
  }

  // 清除所有选中状态
  clearAllSelections() {
    // 清除当前选中的元素
    const selectedItem = this.graph.get('selectedItem');
    if (selectedItem) {
      this.graph.setItemState(selectedItem, 'selected', false);
      this.graph.set('selectedItem', null);
    }

    // 清除边起始节点
    const edgeStartNode = this.graph.get('edgeStartNode');
    if (edgeStartNode) {
      this.graph.setItemState(edgeStartNode, 'selected', false);
      this.graph.set('edgeStartNode', null);
    }

    // 重置工具模式
    const currentMode = this.graph.get('currentMode');
    if (currentMode !== 'default') {
      this.graph.set('currentMode', 'default');
      this.updateButtonState('default');
    }
  }

  bindEvents() {
    // 添加矩形按钮事件
    document.getElementById('addRect').addEventListener('click', () => {
      this.toggleToolMode('addNode');
    });

    // 添加文本按钮事件
    document.getElementById('addText').addEventListener('click', () => {
      this.toggleToolMode('addText');
    });

    // 添加箭头按钮事件
    document.getElementById('addEdge').addEventListener('click', () => {
      this.toggleToolMode('addEdge');
    });

    // 删除按钮事件
    document.getElementById('delete').addEventListener('click', () => {
      this.deleteSelectedItem();
    });

    // 保存按钮事件
    document.getElementById('saveGraph').addEventListener('click', async () => {
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

    // 添加键盘快捷键
    document.addEventListener('keydown', (e) => {
      // 忽略输入框中的快捷键
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // 处理快捷键
      switch (e.key) {
        case 'r':
        case 'R':
          e.preventDefault();
          this.toggleToolMode('addNode');
          break;
        case 't':
        case 'T':
          e.preventDefault();
          this.toggleToolMode('addText');
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          this.toggleToolMode('addEdge');
          break;
        case 'Delete':
          e.preventDefault();
          this.deleteSelectedItem();
          break;
        case 's':
        case 'S':
          if (e.ctrlKey) {
            e.preventDefault();
            this.graph.emit('saveGraph');
          }
          break;
        case 'o':
        case 'O':
          if (e.ctrlKey) {
            e.preventDefault();
            document.getElementById('loadFile').click();
          }
          break;
        case 'Escape':
          e.preventDefault();
          this.clearAllSelections();
          break;
      }
    });
  }
}