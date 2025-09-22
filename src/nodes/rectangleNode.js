import { colors, sizes, styleConfig } from '../config';

export const registerRectangleNode = (G6) => {
  G6.registerNode('rectangle-node', {
    draw(cfg, group) {
      const size = cfg.size || [200, 100];
      const width = size[0];
      const height = size[1];
      
      // 检测是否有子图内容
      const hasSubgraphContent = this.hasSubgraphContent(cfg);
      
      // 主矩形背景
      const mainRect = group.addShape('rect', {
        attrs: {
          x: -width/2,
          y: -height/2,
          width: width,
          height: height,
          fill: cfg.style?.fill || '#fff',
          stroke: cfg.style?.stroke || '#333',
          lineWidth: cfg.style?.lineWidth || 1.5,
          radius: cfg.style?.radius || 8,
          cursor: 'move',
        },
        name: 'main-rect',
      });
      
      // 如果有子图内容，添加双线边框效果
      if (hasSubgraphContent) {
        // 内边框
        const innerBorder = group.addShape('rect', {
          attrs: {
            x: -width/2 + 3,
            y: -height/2 + 3,
            width: width - 6,
            height: height - 6,
            fill: 'transparent',
            stroke: '#333',
            lineWidth: 1,
            radius: Math.max(0, (cfg.style?.radius || 8) - 3),
            cursor: 'move',
          },
          name: 'inner-border',
        });
        
        // 外边框（稍微粗一点）
        const outerBorder = group.addShape('rect', {
          attrs: {
            x: -width/2 - 2,
            y: -height/2 - 2,
            width: width + 4,
            height: height + 4,
            fill: 'transparent',
            stroke: '#333',
            lineWidth: 2,
            radius: (cfg.style?.radius || 8) + 2,
            cursor: 'move',
          },
          name: 'outer-border',
        });
        
        // 将边框置于主矩形后面
        outerBorder.toBack();
        innerBorder.toBack();
      }
      
      // 添加文本标签
      if (cfg.label) {
        const textShape = group.addShape('text', {
          attrs: {
            text: cfg.label,
            x: 0,
            y: 0,
            textAlign: 'center',
            textBaseline: 'middle',
            fill: cfg.labelCfg?.style?.fill || '#333',
            fontSize: cfg.labelCfg?.style?.fontSize || 20,
            fontFamily: cfg.labelCfg?.style?.fontFamily || 'Arial',
            cursor: 'move',
          },
          name: 'label-text',
          capture: false, // 关键：确保事件传递到父节点
        });
        
      }
      
      return mainRect;
    },

    update(cfg, node) {
      const group = node.getContainer();
      const mainRect = group.find(e => e.get('name') === 'main-rect');
      const innerBorder = group.find(e => e.get('name') === 'inner-border');
      const outerBorder = group.find(e => e.get('name') === 'outer-border');
      const textShape = group.find(e => e.get('name') === 'label-text');
      
      if (mainRect) {
        const size = cfg.size || [200, 100];
        const width = size[0];
        const height = size[1];
        
        mainRect.attr({
          x: -width/2,
          y: -height/2,
          width: width,
          height: height,
          fill: cfg.style?.fill || '#fff',
          stroke: cfg.style?.stroke || '#333',
          lineWidth: cfg.style?.lineWidth || 1.5,
          radius: cfg.style?.radius || 8,
        });
        
        // 检测是否有子图内容
        const hasSubgraphContent = this.hasSubgraphContent(cfg);
        
        // 更新或创建双线边框
        if (hasSubgraphContent) {
          // 更新或创建内边框
          if (innerBorder) {
            innerBorder.attr({
              x: -width/2 + 3,
              y: -height/2 + 3,
              width: width - 6,
              height: height - 6,
              stroke: '#333',
              lineWidth: 1,
              radius: Math.max(0, (cfg.style?.radius || 8) - 3),
            });
          } else {
            group.addShape('rect', {
              attrs: {
                x: -width/2 + 3,
                y: -height/2 + 3,
                width: width - 6,
                height: height - 6,
                fill: 'transparent',
                stroke: '#333',
                lineWidth: 1,
                radius: Math.max(0, (cfg.style?.radius || 8) - 3),
                cursor: 'move',
              },
              name: 'inner-border',
            }).toBack();
          }
          
          // 更新或创建外边框
          if (outerBorder) {
            outerBorder.attr({
              x: -width/2 - 2,
              y: -height/2 - 2,
              width: width + 4,
              height: height + 4,
              stroke: '#333',
              lineWidth: 2,
              radius: (cfg.style?.radius || 8) + 2,
            });
          } else {
            group.addShape('rect', {
              attrs: {
                x: -width/2 - 2,
                y: -height/2 - 2,
                width: width + 4,
                height: height + 4,
                fill: 'transparent',
                stroke: '#333',
                lineWidth: 2,
                radius: (cfg.style?.radius || 8) + 2,
                cursor: 'move',
              },
              name: 'outer-border',
            }).toBack();
          }
        } else {
          // 如果没有子图内容，移除双线边框
          if (innerBorder) {
            innerBorder.remove();
          }
          if (outerBorder) {
            outerBorder.remove();
          }
        }
      }
      
      if (textShape && cfg.label) {
        textShape.attr({
          text: cfg.label,
          fill: cfg.labelCfg?.style?.fill || '#333',
          fontSize: cfg.labelCfg?.style?.fontSize || 20,
          fontFamily: cfg.labelCfg?.style?.fontFamily || 'Arial',
        });
        
        // 确保capture属性设置为false
        textShape.set('capture', false);
        
      }
    },

    setState(name, value, node) {
      const group = node.getContainer();
      const mainRect = group.find(e => e.get('name') === 'main-rect');
      const innerBorder = group.find(e => e.get('name') === 'inner-border');
      const outerBorder = group.find(e => e.get('name') === 'outer-border');
      
      if (name === 'selected') {
        if (value) {
          // 选中状态
          if (mainRect) {
            mainRect.attr({
              stroke: '#333',
              shadowColor: '#333',
              shadowBlur: styleConfig.shadowBlur,
            });
          }
          if (innerBorder) {
            innerBorder.attr({
              stroke: '#333',
              shadowColor: '#333',
              shadowBlur: styleConfig.shadowBlur,
            });
          }
          if (outerBorder) {
            outerBorder.attr({
              stroke: '#333',
              shadowColor: '#333',
              shadowBlur: styleConfig.shadowBlur,
            });
          }
        } else {
          // 取消选中状态
          if (mainRect) {
            mainRect.attr({
              stroke: '#333',
              shadowColor: null,
              shadowBlur: 0,
            });
          }
          if (innerBorder) {
            innerBorder.attr({
              stroke: '#333',
              shadowColor: null,
              shadowBlur: 0,
            });
          }
          if (outerBorder) {
            outerBorder.attr({
              stroke: '#333',
              shadowColor: null,
              shadowBlur: 0,
            });
          }
        }
      }
    },

    // 检测节点是否有子图内容的辅助方法
    hasSubgraphContent(cfg) {
      if (!cfg.subGraph) {
        return false;
      }
      
      const subGraph = cfg.subGraph;
      
      // 检查子图中是否有节点或边
      if (subGraph.nodes && subGraph.nodes.length > 0) {
        return true;
      }
      
      if (subGraph.edges && subGraph.edges.length > 0) {
        return true;
      }
      
      return false;
    },
  });
};
