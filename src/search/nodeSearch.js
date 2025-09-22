export class NodeSearch {
  constructor(graph, navigation) {
    this.graph = graph;
    this.navigation = navigation;
    this.isVisible = false;
    this.selectedIndex = 0;
    this.searchResults = [];
    this.createSearchDialog();
  }

  createSearchDialog() {
    // 创建搜索对话框背景容器
    this.dialog = document.createElement('div');
    this.dialog.id = 'node-search-dialog';
    this.dialog.className = 'search-dialog hidden';

    // 创建内容容器
    this.contentContainer = document.createElement('div');

    // 创建搜索输入框
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.className = 'search-input';
    this.searchInput.placeholder = 'Search nodes...';

    // 创建结果列表容器
    this.resultsList = document.createElement('div');
    this.resultsList.className = 'search-results';

    // 创建空状态提示
    this.emptyState = document.createElement('div');
    this.emptyState.className = 'search-empty-state';
    this.emptyState.textContent = 'No nodes found';

    // 组装内容容器
    this.contentContainer.appendChild(this.searchInput);
    this.contentContainer.appendChild(this.resultsList);
    this.contentContainer.appendChild(this.emptyState);
    
    // 组装对话框
    this.dialog.appendChild(this.contentContainer);
    
    document.body.appendChild(this.dialog);

    this.bindDialogEvents();
  }

  bindDialogEvents() {
    // 输入框事件
    this.searchInput.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    // 键盘导航
    this.searchInput.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.selectPrevious();
          break;
        case 'Enter':
          e.preventDefault();
          this.selectCurrentResult();
          break;
        case 'Escape':
          e.preventDefault();
          this.hide();
          break;
      }
    });

    // 点击背景关闭
    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) {
        this.hide();
      }
    });
  }

  show() {
    console.log('🔍 [NodeSearch] 显示搜索对话框');
    
    // 显示当前图形中的实际节点数量
    const currentGraphNodes = this.graph.getNodes();
    console.log('🔍 [NodeSearch] 当前图形实际节点数量:', currentGraphNodes.length);
    console.log('🔍 [NodeSearch] 当前图形节点列表:', 
      currentGraphNodes.map(n => ({
        id: n.get('id'),
        label: n.getModel().label || 'Unnamed',
        type: n.getModel().type || 'rectangle-node'
      }))
    );
    
    console.log('🔍 [NodeSearch] 当前导航状态:', {
      currentLevel: this.navigation.graphStack.length,
      currentGraphId: this.navigation.currentGraphData.id,
      hasParent: !!this.navigation.currentGraphData.parentNode,
      navigationNodesCount: this.navigation.currentGraphData.nodes ? this.navigation.currentGraphData.nodes.length : 0
    });
    
    this.isVisible = true;
    this.dialog.classList.remove('hidden');
    this.searchInput.focus();
    this.searchInput.select();
    
    // 初始化搜索所有节点
    this.handleSearch('');
  }

  hide() {
    this.isVisible = false;
    this.dialog.classList.add('hidden');
    this.searchInput.value = '';
    this.clearResults();
    this.selectedIndex = 0;
  }

  handleSearch(query) {
    console.log('🔍 [NodeSearch] 开始搜索:', query);
    
    // 在搜索前，确保导航数据是最新的
    this.navigation.updateCurrentGraphData();
    
    // 比较实际图形和导航数据的一致性
    const actualGraphNodes = this.graph.getNodes();
    const navigationNodes = this.navigation.currentGraphData.nodes || [];
    
    console.log('🔍 [NodeSearch] 数据一致性检查:', {
      actualNodesCount: actualGraphNodes.length,
      navigationNodesCount: navigationNodes.length,
      actualNodeIds: actualGraphNodes.map(n => n.get('id')),
      navigationNodeIds: navigationNodes.map(n => n.id)
    });
    
    const allNodes = this.getAllNodes();
    console.log('🔍 [NodeSearch] 找到所有节点数量:', allNodes.length);
    
    if (query.trim() === '') {
      // 显示所有节点
      this.searchResults = allNodes;
      console.log('🔍 [NodeSearch] 显示所有节点');
    } else {
      // 过滤匹配的节点
      this.searchResults = allNodes.filter(nodeInfo => 
        nodeInfo.node.label && 
        nodeInfo.node.label.toLowerCase().includes(query.toLowerCase())
      );
      console.log('🔍 [NodeSearch] 匹配结果数量:', this.searchResults.length);
    }

    // 输出前几个搜索结果用于调试
    if (this.searchResults.length > 0) {
      console.log('🔍 [NodeSearch] 前3个搜索结果:', 
        this.searchResults.slice(0, 3).map(r => ({
          id: r.node.id,
          label: r.node.label,
          path: r.path.join(' / '),
          type: r.nodeType
        }))
      );
    }

    this.selectedIndex = 0;
    this.renderResults();
  }

  getAllNodes() {
    const allNodes = [];
    
    // 递归收集所有节点
    const collectNodes = (graphData, path = ['Root'], parentNodeId = null) => {
      if (!graphData || !graphData.nodes) return;
      
      graphData.nodes.forEach(node => {
        // 构建当前节点的完整路径
        const currentPath = [...path];
        
        // 收集所有类型的节点，但标记类型
        allNodes.push({
          node: node,
          path: currentPath,
          graphData: graphData,
          nodeType: node.type || 'rectangle-node',
          parentNodeId: parentNodeId
        });

        // 只有矩形节点可以有子图
        if ((!node.type || node.type === 'rectangle-node') && node.subGraph && node.subGraph.nodes) {
          const nodeLabel = node.label || 'Unnamed';
          // 子图中的节点路径应该包含当前节点
          collectNodes(node.subGraph, [...currentPath, nodeLabel], node.id);
        }
      });
    };

    // 从根图开始收集
    collectNodes(this.getRootGraphData());

    console.log('🔍 [NodeSearch] 收集到的所有节点:', allNodes.length);
    
    // 输出前几个节点的路径信息用于调试
    if (allNodes.length > 0) {
      console.log('🔍 [NodeSearch] 节点路径示例:', 
        allNodes.slice(0, 5).map(nodeInfo => ({
          id: nodeInfo.node.id,
          label: nodeInfo.node.label,
          path: nodeInfo.path.join(' / '),
          type: nodeInfo.nodeType
        }))
      );
    }

    return allNodes;
  }

  getRootGraphData() {
    console.log('🔍 [NodeSearch] 获取根图数据...');
    
    // 获取完整的根图数据
    if (this.navigation.graphStack.length === 0) {
      // 如果在根图中，先更新当前数据以包含最新的节点，然后返回
      console.log('🔍 [NodeSearch] 当前在根图中，更新数据');
      this.navigation.updateCurrentGraphData();
      
      console.log('🔍 [NodeSearch] 根图节点数量:', this.navigation.currentGraphData.nodes ? this.navigation.currentGraphData.nodes.length : 0);
      
      return this.navigation.currentGraphData;
    }
    
    console.log('🔍 [NodeSearch] 当前在子图中，重建完整根图数据');
    
    // 如果在子图中，需要构建完整的根图数据
    // 先保存当前状态
    this.navigation.updateCurrentGraphData();
    
    // 从栈底开始重建完整的图数据结构
    let rootData = { ...this.navigation.graphStack[0] };
    
    console.log('🔍 [NodeSearch] 栈底根图节点数量:', rootData.nodes ? rootData.nodes.length : 0);
    
    // 递归重建子图数据
    const rebuildWithSubgraphs = (graphData, stackIndex = 0) => {
      if (!graphData || !graphData.nodes) return graphData;
      
      const rebuiltNodes = graphData.nodes.map(node => {
        const rebuiltNode = { ...node };
        
        // 如果这个节点有对应的子图数据
        if (stackIndex + 1 < this.navigation.graphStack.length) {
          const nextGraph = this.navigation.graphStack[stackIndex + 1];
          if (nextGraph.parentNode === node.id) {
            rebuiltNode.subGraph = rebuildWithSubgraphs(nextGraph, stackIndex + 1);
          }
        } else if (stackIndex + 1 === this.navigation.graphStack.length && this.navigation.currentGraphData.parentNode === node.id) {
          // 最后一层，使用当前图数据
          rebuiltNode.subGraph = { ...this.navigation.currentGraphData };
        }
        
        return rebuiltNode;
      });
      
      return {
        ...graphData,
        nodes: rebuiltNodes
      };
    };
    
    const result = rebuildWithSubgraphs(rootData);
    console.log('🔍 [NodeSearch] 重建后根图节点数量:', result.nodes ? result.nodes.length : 0);
    
    return result;
  }

  renderResults() {
    this.clearResults();

    if (this.searchResults.length === 0) {
      this.emptyState.style.display = 'block';
      return;
    }

    this.emptyState.style.display = 'none';

    this.searchResults.forEach((nodeInfo, index) => {
      const resultItem = document.createElement('div');
      resultItem.className = `search-result-item ${index === this.selectedIndex ? 'selected' : ''}`;
      
      const nodeLabel = nodeInfo.node.label || 'Unnamed';
      const pathString = nodeInfo.path.join(' / ');
      
      resultItem.innerHTML = `
        <div class="result-node-name">${nodeLabel}</div>
        <div class="result-node-path">${pathString}</div>
      `;

      resultItem.addEventListener('click', () => {
        this.selectedIndex = index;
        this.selectCurrentResult();
      });

      this.resultsList.appendChild(resultItem);
    });
  }

  clearResults() {
    this.resultsList.innerHTML = '';
  }

  selectNext() {
    if (this.searchResults.length > 0) {
      this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
      this.updateSelection();
    }
  }

  selectPrevious() {
    if (this.searchResults.length > 0) {
      this.selectedIndex = this.selectedIndex === 0 
        ? this.searchResults.length - 1 
        : this.selectedIndex - 1;
      this.updateSelection();
    }
  }

  updateSelection() {
    const items = this.resultsList.querySelectorAll('.search-result-item');
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex);
    });

    // 滚动到选中项
    if (items[this.selectedIndex]) {
      items[this.selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }

  selectCurrentResult() {
    if (this.searchResults.length === 0 || this.selectedIndex < 0) return;

    const selectedNodeInfo = this.searchResults[this.selectedIndex];
    this.navigateToNode(selectedNodeInfo);
    this.hide();
  }

  navigateToNode(nodeInfo) {
    const { node, path } = nodeInfo;
    
    console.log('🔍 [NodeSearch] 导航到节点:', {
      nodeId: node.id,
      nodeLabel: node.label,
      path: path,
      nodeType: nodeInfo.nodeType || 'unknown'
    });
    
    // 计算需要导航到的层级
    const targetLevel = path.length - 1; // 减1因为path包含Root
    const currentLevel = this.navigation.graphStack.length;
    
    console.log('🔍 [NodeSearch] 层级信息:', {
      targetLevel,
      currentLevel,
      needNavigation: targetLevel !== currentLevel
    });
    
    // 如果目标节点在当前层级，直接居中显示
    if (targetLevel === currentLevel) {
      console.log('🔍 [NodeSearch] 节点在当前层级，直接居中');
      this.centerOnNode(node.id);
      return;
    }
    
    // 执行精确的路径导航
    this.navigateToPath(path, node.id);
  }

  // 新增：精确路径导航方法
  navigateToPath(targetPath, targetNodeId) {
    console.log('🔍 [NodeSearch] 开始精确路径导航:', {
      targetPath,
      targetNodeId
    });

    // 先返回到根图
    this.navigation.navigateToLevel(0);
    
    // 如果目标就在根图，直接居中
    if (targetPath.length === 1) {
      setTimeout(() => {
        this.centerOnNode(targetNodeId);
      }, 50);
      return;
    }
    
    // 逐级导航到目标路径
    this.navigateStepByStep(targetPath, 1, targetNodeId);
  }
  
  // 新增：逐步导航方法
  navigateStepByStep(targetPath, currentStep, targetNodeId) {
    if (currentStep >= targetPath.length) {
      // 已到达目标层级，居中显示节点
      console.log('🔍 [NodeSearch] 到达目标层级，居中节点');
      setTimeout(() => {
        this.centerOnNode(targetNodeId);
      }, 100);
      return;
    }
    
    const stepNodeName = targetPath[currentStep];
    console.log('🔍 [NodeSearch] 导航步骤', currentStep, '寻找节点:', stepNodeName);
    
    // 在当前层级寻找对应的节点
    const currentNodes = this.graph.getNodes();
    const targetNode = currentNodes.find(node => {
      const model = node.getModel();
      return (model.label || 'Unnamed') === stepNodeName;
    });
    
    if (!targetNode) {
      console.error('🔍 [NodeSearch] 未找到路径节点:', stepNodeName);
      console.log('🔍 [NodeSearch] 当前层级可用节点:', 
        currentNodes.map(n => n.getModel().label || 'Unnamed')
      );
      return;
    }
    
    const targetModel = targetNode.getModel();
    console.log('🔍 [NodeSearch] 找到路径节点:', {
      name: stepNodeName,
      type: targetModel.type,
      hasSubGraph: !!targetModel.subGraph
    });
    
    // 检查节点类型，只有矩形节点可以进入子图
    if (targetModel.type === 'image-node' || targetModel.type === 'text-only') {
      console.error('🔍 [NodeSearch] 节点类型不支持子图:', targetModel.type);
      return;
    }
    
    // 如果这是最后一步，目标节点就在这个子图中
    if (currentStep === targetPath.length - 1) {
      // 进入子图并居中目标节点
      console.log('🔍 [NodeSearch] 进入最终子图');
      this.navigation.enterSubgraph(targetNode);
      setTimeout(() => {
        this.centerOnNode(targetNodeId);
      }, 150);
    } else {
      // 进入子图并继续下一步导航
      console.log('🔍 [NodeSearch] 进入中间子图，继续导航');
      this.navigation.enterSubgraph(targetNode);
      setTimeout(() => {
        this.navigateStepByStep(targetPath, currentStep + 1, targetNodeId);
      }, 100);
    }
  }

  centerOnNode(nodeId) {
    console.log('🔍 [NodeSearch] 开始居中节点:', nodeId);
    
    const node = this.graph.findById(nodeId);
    if (!node) {
      console.error('🔍 [NodeSearch] 未找到节点:', nodeId);
      console.log('🔍 [NodeSearch] 当前图中的所有节点:', this.graph.getNodes().map(n => n.get('id')));
      return;
    }

    console.log('🔍 [NodeSearch] 找到节点:', node.get('id'), node.getModel());
    
    // 清除所有选择状态
    this.graph.getNodes().forEach(n => {
      this.graph.setItemState(n, 'selected', false);
    });
    
    // 选中目标节点
    this.graph.setItemState(node, 'selected', true);
    console.log('🔍 [NodeSearch] 已选中节点:', nodeId);
    
    // 使用G6的focusItem方法进行居中，这比手动计算更可靠
    try {
      // 先重置缩放比例以确保节点能正确居中
      const currentZoom = this.graph.getZoom();
      console.log('🔍 [NodeSearch] 当前缩放比例:', currentZoom);
      
      // 如果缩放比例过小或过大，先调整到合适的比例
      if (currentZoom < 0.5 || currentZoom > 2) {
        console.log('🔍 [NodeSearch] 调整缩放比例到 1.0');
        this.graph.zoomTo(1.0);
      }
      
      // 使用focusItem方法居中显示节点
      console.log('🔍 [NodeSearch] 开始执行focusItem');
      this.graph.focusItem(node, true, {
        easing: 'easeCubic',
        duration: 200,
      });
      
      console.log('🔍 [NodeSearch] focusItem 执行完成');
      
      // 添加一个小延迟后检查结果
      setTimeout(() => {
        const nodeModel = node.getModel();
        const canvasPoint = this.graph.getCanvasByPoint(nodeModel.x, nodeModel.y);
        const width = this.graph.get('width');
        const height = this.graph.get('height');
        
        console.log('🔍 [NodeSearch] 居中结果检查:');
        console.log('  - 节点世界坐标:', { x: nodeModel.x, y: nodeModel.y });
        console.log('  - 节点画布坐标:', canvasPoint);
        console.log('  - 画布中心:', { x: width / 2, y: height / 2 });
        console.log('  - 距离画布中心的偏差:', {
          x: Math.abs(canvasPoint.x - width / 2),
          y: Math.abs(canvasPoint.y - height / 2)
        });
      }, 250);
      
    } catch (error) {
      console.error('🔍 [NodeSearch] focusItem 执行失败:', error);
      
      // 如果focusItem失败，回退到手动计算方式
      console.log('🔍 [NodeSearch] 使用手动计算方式居中');
      this.fallbackCenterNode(node);
    }
  }

  // 备用的手动居中方法
  fallbackCenterNode(node) {
    const model = node.getModel();
    
    // 计算居中位置
    const width = this.graph.get('width');
    const height = this.graph.get('height');
    const centerX = width / 2;
    const centerY = height / 2;
    
    console.log('🔍 [NodeSearch] 手动居中计算:');
    console.log('  - 画布尺寸:', { width, height });
    console.log('  - 画布中心:', { x: centerX, y: centerY });
    console.log('  - 节点位置:', { x: model.x, y: model.y });
    
    // 获取当前缩放级别
    const zoom = this.graph.getZoom();
    console.log('  - 当前缩放:', zoom);
    
    // 计算需要移动的距离
    const dx = centerX - model.x * zoom;
    const dy = centerY - model.y * zoom;
    
    console.log('  - 需要平移:', { dx, dy });
    
    // 移动画布使节点居中
    this.graph.translate(dx, dy);
    
    console.log('🔍 [NodeSearch] 手动居中完成');
  }
}
