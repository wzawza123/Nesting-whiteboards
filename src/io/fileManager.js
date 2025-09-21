export class FileManager {
  constructor(graph, navigation) {
    this.graph = graph;
    this.navigation = navigation;
    this.bindEvents();
  }

  saveGraph() {
    // 更新当前图形状态
    this.navigation.updateCurrentGraphData();
    
    // 获取完整数据（包括所有子图）
    const completeData = {
      currentGraph: this.getCompleteGraphData(this.navigation.currentGraphData),
      graphStack: this.navigation.graphStack.map(graph => this.getCompleteGraphData(graph))
    };
    
    // 转换为JSON并创建blob
    const jsonString = JSON.stringify(completeData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 创建下载链接并触发下载
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'graph-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  loadGraph(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedData = JSON.parse(e.target.result);
        
        // 恢复完整数据结构
        this.navigation.currentGraphData = this.restoreGraphData(loadedData.currentGraph);
        this.navigation.graphStack = loadedData.graphStack.map(graph => this.restoreGraphData(graph));
        
        // 更新图形显示
        this.graph.data(this.navigation.currentGraphData);
        this.graph.render();
        
        // 更新导航
        this.navigation.updatePath();
        this.navigation.backButton.update();
      } catch (error) {
        console.error('Error loading graph data:', error);
        alert('Error loading graph data. Please check if the file is valid.');
      }
    };
    reader.readAsText(file);
  }

  getCompleteGraphData(graphData) {
    const nodes = graphData.nodes.map(node => {
      const newNode = { ...node };
      if (newNode.subGraph) {
        newNode.subGraph = this.getCompleteGraphData(newNode.subGraph);
      }
      return newNode;
    });
    
    return {
      ...graphData,
      nodes,
      edges: graphData.edges.map(edge => ({ ...edge }))
    };
  }

  restoreGraphData(data) {
    // 恢复节点及其子图
    const nodes = data.nodes.map(node => {
      const newNode = { ...node };
      if (newNode.subGraph) {
        newNode.subGraph = this.restoreGraphData(newNode.subGraph);
      }
      return newNode;
    });

    return {
      ...data,
      nodes,
      edges: data.edges.map(edge => ({ ...edge }))
    };
  }

  bindEvents() {
    // 保存图形事件
    this.graph.on('saveGraph', () => {
      this.saveGraph();
    });

    // 加载图形事件
    this.graph.on('loadGraph', (file) => {
      this.loadGraph(file);
    });
  }
}
