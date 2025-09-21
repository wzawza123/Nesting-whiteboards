import { sizes, colors } from '../config';

export const registerImageNode = (G6) => {
  G6.registerNode('image-node', {
    draw(cfg, group) {
      const size = cfg.size || [100, 100];
      const width = size[0];
      const height = size[1];
      
      // 添加图片形状
      const imageShape = group.addShape('image', {
        attrs: {
          x: -width/2,
          y: -height/2,
          width: width,
          height: height,
          img: cfg.img,
          cursor: 'move',
        },
        name: 'image-shape',
      });

      // 添加选择边框（初始不可见）
      const borderShape = group.addShape('rect', {
        attrs: {
          x: -width/2,
          y: -height/2,
          width: width,
          height: height,
          stroke: 'transparent',
          lineWidth: 2,
          cursor: 'move',
        },
        name: 'image-border',
      });

      // 添加调整大小的控制点（初始不可见）
      const controlSize = sizes.controlPoint;
      const controlPoints = [
        { x: -width/2, y: -height/2, cursor: 'nw-resize', name: 'nw' },
        { x: width/2, y: -height/2, cursor: 'ne-resize', name: 'ne' },
        { x: width/2, y: height/2, cursor: 'se-resize', name: 'se' },
        { x: -width/2, y: height/2, cursor: 'sw-resize', name: 'sw' }
      ];

      controlPoints.forEach(point => {
        group.addShape('rect', {
          attrs: {
            x: point.x - controlSize/2,
            y: point.y - controlSize/2,
            width: controlSize,
            height: controlSize,
            fill: '#fff',
            stroke: colors.primary,
            cursor: point.cursor,
            opacity: 0,
          },
          name: `control-point-${point.name}`,
        });
      });

      return imageShape;
    },

    update(cfg, node) {
      const group = node.getContainer();
      const imageShape = group.find(e => e.get('name') === 'image-shape');
      const borderShape = group.find(e => e.get('name') === 'image-border');
      
      if (imageShape) {
        const size = cfg.size || [100, 100];
        const width = size[0];
        const height = size[1];
        const controlSize = sizes.controlPoint;
        
        imageShape.attr({
          x: -width/2,
          y: -height/2,
          width: width,
          height: height,
          img: cfg.img,
        });
        
        borderShape.attr({
          x: -width/2,
          y: -height/2,
          width: width,
          height: height,
        });

        // 更新控制点位置
        const controlPoints = [
          { x: -width/2, y: -height/2, name: 'nw' },
          { x: width/2, y: -height/2, name: 'ne' },
          { x: width/2, y: height/2, name: 'se' },
          { x: -width/2, y: height/2, name: 'sw' }
        ];

        controlPoints.forEach(point => {
          const control = group.find(e => e.get('name') === `control-point-${point.name}`);
          if (control) {
            control.attr({
              x: point.x - controlSize/2,
              y: point.y - controlSize/2,
            });
          }
        });
      }
    },

    setState(name, value, node) {
      const group = node.getContainer();
      const borderShape = group.find(e => e.get('name') === 'image-border');
      
      if (name === 'selected') {
        borderShape.attr('stroke', value ? colors.primary : 'transparent');
        
        // 显示/隐藏控制点
        ['nw', 'ne', 'se', 'sw'].forEach(pos => {
          const control = group.find(e => e.get('name') === `control-point-${pos}`);
          if (control) {
            control.attr('opacity', value ? 1 : 0);
          }
        });
      }
    },
  });
};
