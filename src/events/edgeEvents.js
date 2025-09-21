import { updateSelection } from './utils';

export const bindEdgeEvents = (graph) => {
  // 边点击事件
  graph.on('edge:click', (ev) => {
    const edge = ev.item;
    updateSelection(graph, edge);
  });
};