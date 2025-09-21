import { colors } from '../config';
import { BackButton } from './backButton';

export class Navigation {
  constructor(graph) {
    this.graph = graph;
    this.graphStack = [];
    this.currentGraphData = {
      id: 'root',
      nodes: [],
      edges: [],
      parentNode: null,
      label: 'Root'
    };
    this.backButton = new BackButton(this);
    this.createNavigationBar();
    this.bindEvents();
  }

  createNavigationBar() {
    const navBar = document.createElement('div');
    navBar.id = 'navigation-bar';
    
    const pathSpan = document.createElement('span');
    pathSpan.className = 'nav-path';
    pathSpan.textContent = 'Root';
    
    navBar.appendChild(pathSpan);
    document.body.appendChild(navBar);
  }

  updatePath() {
    const navBar = document.getElementById('navigation-bar');
    const pathElements = [];
    
    // 添加根节点及点击处理
    pathElements.push(`<span class="nav-node" onclick="window._navigateToLevel(0)">Root</span>`);
    
    // 添加中间节点及点击处理
    this.graphStack.forEach((graph, index) => {
      const node = graph.nodes.find(n => n.id === this.graphStack[index + 1]?.parentNode);
      if (node) {
        pathElements.push('<span class="nav-separator">/</span>');
        pathElements.push(
          `<span class="nav-node" onclick="window._navigateToLevel(${index + 1})">${node.label || 'Unnamed'}</span>`
        );
      }
    });
    
    // 添加当前节点（如果在子图中）
    if (this.currentGraphData.parentNode) {
      const parentGraph = this.graphStack[this.graphStack.length - 1];
      const parentNode = parentGraph.nodes.find(n => n.id === this.currentGraphData.parentNode);
      if (parentNode) {
        pathElements.push('<span class="nav-separator">/</span>');
        pathElements.push(`<span class="nav-current">${parentNode.label || 'Unnamed'}</span>`);
      }
    }
    
    navBar.querySelector('.nav-path').innerHTML = pathElements.join('');
  }

  navigateToLevel(level) {
    if (level < 0 || level > this.graphStack.length) return;
    
    // 保存当前状态
    this.updateCurrentGraphData();
    
    if (level === 0) {
      // 导航到根节点
      while (this.graphStack.length > 0) {
        const currentState = this.graphStack.pop();
        const parentNode = currentState.nodes.find(
          node => node.id === this.currentGraphData.parentNode
        );
        if (parentNode) {
          parentNode.subGraph = {...this.currentGraphData};
        }
        this.currentGraphData = currentState;
      }
    } else {
      // 导航到指定层级
      while (this.graphStack.length > level) {
        const currentState = this.graphStack.pop();
        const parentNode = currentState.nodes.find(
          node => node.id === this.currentGraphData.parentNode
        );
        if (parentNode) {
          parentNode.subGraph = {...this.currentGraphData};
        }
        this.currentGraphData = currentState;
      }
    }
    
    // 更新图形和UI
    this.graph.data(this.currentGraphData);
    this.graph.render();
    this.updatePath();
    this.backButton.update();
  }

  enterSubgraph(node) {
    const model = node.getModel();
    
    // 只处理矩形节点
    if (model.type === 'text-only') return;
    
    // 保存当前图形状态
    this.updateCurrentGraphData();
    
    // 将当前状态推入栈
    this.graphStack.push({...this.currentGraphData});
    
    // 初始化子图（如果不存在）
    if (!model.subGraph) {
      model.subGraph = {
        id: `subgraph-${model.id}`,
        nodes: [],
        edges: [],
        parentNode: model.id
      };
    }
    
    // 切换到子图
    this.currentGraphData = model.subGraph;
    this.graph.data(this.currentGraphData);
    this.graph.render();
    
    // 更新导航
    this.updatePath();
    this.backButton.update();
  }

  goBack() {
    if (this.graphStack.length > 0) {
      // 保存当前子图状态
      this.updateCurrentGraphData();
      
      // 更新父节点的子图数据
      const parentGraph = this.graphStack[this.graphStack.length - 1];
      const parentNode = parentGraph.nodes.find(
        node => node.id === this.currentGraphData.parentNode
      );
      if (parentNode) {
        parentNode.subGraph = {...this.currentGraphData};
      }
      
      // 恢复父图
      this.currentGraphData = this.graphStack.pop();
      this.graph.data(this.currentGraphData);
      this.graph.render();
      
      // 更新导航
      this.updatePath();
      this.backButton.update();
    }
  }

  updateCurrentGraphData() {
    const savedState = this.graph.save();
    this.currentGraphData.nodes = savedState.nodes.map(node => ({...node}));
    this.currentGraphData.edges = savedState.edges.map(edge => ({...edge}));
  }

  bindEvents() {
    // 双击进入子图
    this.graph.on('node:dblclick', (ev) => {
      this.enterSubgraph(ev.item);
    });

    // 暴露导航函数到全局作用域（用于导航路径点击）
    window._navigateToLevel = (level) => {
      this.navigateToLevel(level);
    };
  }
}
