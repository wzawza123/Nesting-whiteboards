import { createToolbarButtons } from './buttons';

export class Toolbar {
  constructor(graph) {
    this.graph = graph;
    this.toolbar = createToolbarButtons();
    document.body.appendChild(this.toolbar);
    this.bindEvents();
  }

  bindEvents() {
    // 添加矩形按钮事件
    document.getElementById('addRect').addEventListener('click', () => {
      this.graph.set('currentMode', 'addNode');
    });

    // 添加文本按钮事件
    document.getElementById('addText').addEventListener('click', () => {
      this.graph.set('currentMode', 'addText');
    });

    // 添加箭头按钮事件
    document.getElementById('addEdge').addEventListener('click', () => {
      this.graph.set('currentMode', 'addEdge');
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
        event.target.value = ''; // 清除文件输入
      }
    });
  }
}