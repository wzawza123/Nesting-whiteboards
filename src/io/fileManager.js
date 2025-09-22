export class FileManager {
  constructor(graph, navigation) {
    this.graph = graph;
    this.navigation = navigation;
    this.currentFilePath = null; // 记住当前文件路径
    this.currentFileHandle = null; // File System Access API 的文件句柄
    this.isSaved = false; // 跟踪保存状态
    this.bindEvents();
    this.bindModificationEvents();
    // 初始化状态栏
    this.updateStatusBar(false);
  }

  async saveGraph() {
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
    
    // 检查是否支持 File System Access API
    if ('showSaveFilePicker' in window && this.currentFileHandle) {
      // 使用 File System Access API 直接覆盖现有文件
      try {
        const writable = await this.currentFileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        console.log('文件已保存到:', this.currentFileHandle.name);
        this.updateSaveStatus(true);
      } catch (error) {
        console.error('保存文件失败:', error);
        // 如果保存失败，回退到下载方式
        this.saveAs(blob, this.currentFileHandle.name);
      }
    } else if ('showSaveFilePicker' in window) {
      // 首次保存，让用户选择保存位置
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: 'graph-data.json',
          types: [{
            description: 'JSON files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        this.currentFileHandle = fileHandle;
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        console.log('文件已保存到:', fileHandle.name);
        this.updateSaveStatus(true);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('保存文件失败:', error);
          // 如果保存失败，回退到下载方式
          this.saveAs(blob);
        }
      }
    } else {
      // 不支持 File System Access API，使用传统下载方式
      if (this.currentFilePath) {
        this.saveAs(blob, this.currentFilePath);
      } else {
        this.saveAs(blob);
      }
    }
  }

  saveAs(blob, suggestedName = 'graph-data.json') {
    // 创建下载链接并触发下载
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = suggestedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // 记录文件名（用于不支持 File System Access API 的情况）
    this.currentFilePath = suggestedName;
    this.updateSaveStatus(true);
  }

  updateSaveStatus(isSaved) {
    this.isSaved = isSaved;
    // 更新状态栏显示保存状态
    this.updateStatusBar(isSaved);
  }

  markAsModified() {
    if (this.isSaved) {
      this.isSaved = false;
      this.updateStatusBar(false);
    }
  }

  updateStatusBar(isSaved) {
    let statusBar = document.getElementById('status-bar');
    
    // 如果状态栏不存在，创建一个
    if (!statusBar) {
      statusBar = document.createElement('div');
      statusBar.id = 'status-bar';
      statusBar.className = 'status-bar';
      document.body.appendChild(statusBar);
    }

    if (isSaved && (this.currentFileHandle || this.currentFilePath)) {
      const fileName = this.currentFileHandle ? this.currentFileHandle.name : this.currentFilePath;
      statusBar.innerHTML = `✓ 已保存到: ${fileName}`;
      statusBar.className = 'status-bar saved';
    } else if (this.currentFileHandle || this.currentFilePath) {
      // 有文件但未保存
      const fileName = this.currentFileHandle ? this.currentFileHandle.name : this.currentFilePath;
      statusBar.innerHTML = `● ${fileName} - 未保存`;
      statusBar.className = 'status-bar unsaved';
    } else {
      // 没有文件
      statusBar.innerHTML = '● 新文档 - 未保存';
      statusBar.className = 'status-bar unsaved';
    }
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
        
        // 记录加载的文件信息
        this.currentFilePath = file.name;
        this.currentFileHandle = null; // 加载的文件没有文件句柄
        this.updateSaveStatus(true);
        
        console.log('文件已加载:', file.name);
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
    this.graph.on('saveGraph', async () => {
      await this.saveGraph();
    });

    // 加载图形事件
    this.graph.on('loadGraph', (file) => {
      this.loadGraph(file);
    });
  }

  bindModificationEvents() {
    // 监听所有可能的修改事件
    
    // 节点添加事件
    this.graph.on('afteradditem', (e) => {
      if (e.item) {
        try {
          // 检查e.item是否有getType方法
          if (typeof e.item.getType === 'function') {
            const itemType = e.item.getType();
            if (itemType === 'node' || itemType === 'edge') {
              this.markAsModified();
            }
          } else {
            // 尝试其他方式获取项目类型
            let itemType = null;
            
            // 方法1: 检查e.item的类型属性
            if (e.item.type) {
              itemType = e.item.type;
            }
            // 方法2: 检查e.item的itemType属性
            else if (e.item.itemType) {
              itemType = e.item.itemType;
            }
            // 方法3: 检查e.item的getItemType方法
            else if (typeof e.item.getItemType === 'function') {
              itemType = e.item.getItemType();
            }
            // 方法4: 检查e.item的getModel方法返回的type
            else if (typeof e.item.getModel === 'function') {
              try {
                const model = e.item.getModel();
                if (model && model.type) {
                  itemType = model.type;
                }
              } catch (modelError) {
                console.warn('获取模型失败:', modelError);
              }
            }
            
            // 如果找到了类型，检查是否为节点或边
            if (itemType === 'node' || itemType === 'edge' || itemType === 'rectangle-node' || itemType === 'text-only' || itemType === 'image-node') {
              this.markAsModified();
            } else {
              // 如果无法确定类型，仍然标记为已修改（保守策略）
              this.markAsModified();
            }
          }
        } catch (error) {
          // 如果item已被销毁，仍然标记为已修改
          console.warn('添加节点时获取类型失败，但仍标记为已修改:', error);
          this.markAsModified();
        }
      }
    });

    // 节点删除事件
    this.graph.on('afterremoveitem', (e) => {
      if (e.item) {
        try {
          // 检查e.item是否有getType方法
          if (typeof e.item.getType === 'function') {
            const itemType = e.item.getType();
            if (itemType === 'node' || itemType === 'edge') {
              this.markAsModified();
            }
          } else {
            // 尝试其他方式获取项目类型
            let itemType = null;
            
            // 方法1: 检查e.item的类型属性
            if (e.item.type) {
              itemType = e.item.type;
            }
            // 方法2: 检查e.item的itemType属性
            else if (e.item.itemType) {
              itemType = e.item.itemType;
            }
            // 方法3: 检查e.item的getItemType方法
            else if (typeof e.item.getItemType === 'function') {
              itemType = e.item.getItemType();
            }
            // 方法4: 检查e.item的getModel方法返回的type
            else if (typeof e.item.getModel === 'function') {
              try {
                const model = e.item.getModel();
                if (model && model.type) {
                  itemType = model.type;
                }
              } catch (modelError) {
                console.warn('获取模型失败:', modelError);
              }
            }
            
            // 如果找到了类型，检查是否为节点或边
            if (itemType === 'node' || itemType === 'edge' || itemType === 'rectangle-node' || itemType === 'text-only' || itemType === 'image-node') {
              this.markAsModified();
            } else {
              // 如果无法确定类型，仍然标记为已修改（保守策略）
              console.warn('无法确定删除项目的类型，但仍标记为已修改:', {
                item: e.item,
                itemType: itemType,
                availableMethods: {
                  hasType: 'type' in e.item,
                  hasItemType: 'itemType' in e.item,
                  hasGetItemType: typeof e.item.getItemType === 'function',
                  hasGetModel: typeof e.item.getModel === 'function'
                }
              });
              this.markAsModified();
            }
          }
        } catch (error) {
          // 如果item已被销毁，仍然标记为已修改
          console.warn('删除节点时获取类型失败，但仍标记为已修改:', error);
          this.markAsModified();
        }
      }
    });

    // 节点更新事件（包括移动、调整大小、编辑标签、样式修改等）
    this.graph.on('afterupdateitem', (e) => {
      if (e.item) {
        try {
          // 检查e.item是否有getType方法
          if (typeof e.item.getType === 'function') {
            const itemType = e.item.getType();
            if (itemType === 'node' || itemType === 'edge') {
              this.markAsModified();
            }
          } else {
            // 尝试其他方式获取项目类型
            let itemType = null;
            
            // 方法1: 检查e.item的类型属性
            if (e.item.type) {
              itemType = e.item.type;
            }
            // 方法2: 检查e.item的itemType属性
            else if (e.item.itemType) {
              itemType = e.item.itemType;
            }
            // 方法3: 检查e.item的getItemType方法
            else if (typeof e.item.getItemType === 'function') {
              itemType = e.item.getItemType();
            }
            // 方法4: 检查e.item的getModel方法返回的type
            else if (typeof e.item.getModel === 'function') {
              try {
                const model = e.item.getModel();
                if (model && model.type) {
                  itemType = model.type;
                }
              } catch (modelError) {
                console.warn('获取模型失败:', modelError);
              }
            }
            
            // 如果找到了类型，检查是否为节点或边
            if (itemType === 'node' || itemType === 'edge' || itemType === 'rectangle-node' || itemType === 'text-only' || itemType === 'image-node') {
              this.markAsModified();
            } else {
              // 如果无法确定类型，仍然标记为已修改（保守策略）
              this.markAsModified();
            }
          }
        } catch (error) {
          // 如果item已被销毁，仍然标记为已修改
          console.warn('更新节点时获取类型失败，但仍标记为已修改:', error);
          this.markAsModified();
        }
      }
    });

    // 节点拖拽结束事件（位置改变）
    this.graph.on('node:dragend', () => {
      this.markAsModified();
    });

    // 监听画布变化（如果有其他修改）
    this.graph.on('graphstatechange', () => {
      this.markAsModified();
    });
  }
}
