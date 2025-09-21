import G6 from '@antv/g6';
import { graphConfig } from './config';
import { registerImageNode, registerTextNode } from './nodes';
import { bindNodeEvents, bindEdgeEvents, bindCanvasEvents, bindResizeEvents, bindPasteEvents } from './events';
import { Toolbar } from './toolbar';
import { ContextMenu } from './contextMenu';
import { Navigation } from './navigation';
import { FileManager } from './io';
import './styles/index.css';

// 初始化图形实例
const graph = new G6.Graph(graphConfig);

// 设置初始模式
graph.set('currentMode', 'default');

// 注册自定义节点
registerImageNode(G6);
registerTextNode(G6);

// 初始化各个模块
const navigation = new Navigation(graph);
const contextMenu = new ContextMenu(graph);
const toolbar = new Toolbar(graph);
const fileManager = new FileManager(graph, navigation);

// 将上下文菜单实例保存到图形实例中
graph.set('contextMenu', contextMenu);

// 绑定事件
bindNodeEvents(graph);
bindEdgeEvents(graph);
bindCanvasEvents(graph);
bindResizeEvents(graph);
bindPasteEvents(graph);

// 初始化渲染
graph.data(navigation.currentGraphData);
graph.render();