import { colors, sizes, styleConfig } from '../config';

export const registerTextNode = (G6) => {
  G6.registerNode('text-only', {
    draw(cfg, group) {
      // 获取样式配置
      const style = cfg.labelCfg?.style || {};
      
      // 添加文本形状
      const textShape = group.addShape('text', {
        attrs: {
          text: cfg.label || 'Text',
          x: 0,
          y: 0,
          textAlign: 'center',
          textBaseline: 'middle',
          fill: style.fill || colors.black,
          fontSize: style.fontSize || styleConfig.fontSize.medium,
          fontFamily: 'Arial',
          cursor: 'move',
        },
        name: 'text-shape',
      });
      
      const textBox = textShape.getBBox();
      const padding = sizes.padding.medium;
      
      // 添加背景矩形（选中时显示）
      const backgroundRect = group.addShape('rect', {
        attrs: {
          x: textBox.x - padding,
          y: textBox.y - padding,
          width: textBox.width + (padding * 2),
          height: textBox.height + (padding * 2),
          fill: 'transparent',
          stroke: 'transparent',
          lineWidth: 2,
          radius: styleConfig.borderRadius,
          cursor: 'move',
        },
        name: 'text-bg',
      });
      
      // 将背景置于文本后面
      backgroundRect.toBack();
      
      return textShape;
    },

    update(cfg, node) {
      const group = node.getContainer();
      const textShape = group.find(e => e.get('name') === 'text-shape');
      const backgroundRect = group.find(e => e.get('name') === 'text-bg');
      
      if (textShape) {
        const style = cfg.labelCfg?.style || {};
        textShape.attr({
          text: cfg.label,
          fill: style.fill || colors.black,
          fontSize: style.fontSize || styleConfig.fontSize.medium
        });
      }
      
      if (backgroundRect) {
        const textBox = textShape.getBBox();
        const padding = sizes.padding.medium;
        backgroundRect.attr({
          x: textBox.x - padding,
          y: textBox.y - padding,
          width: textBox.width + (padding * 2),
          height: textBox.height + (padding * 2),
        });
      }
    },

    setState(name, value, node) {
      const group = node.getContainer();
      const backgroundRect = group.find(e => e.get('name') === 'text-bg');
      
      if (name === 'selected') {
        if (value) {
          // 选中状态
          backgroundRect.attr({
            stroke: colors.primary,
            shadowColor: colors.primary,
            shadowBlur: styleConfig.shadowBlur,
          });
        } else {
          // 取消选中状态
          backgroundRect.attr({
            stroke: 'transparent',
            shadowColor: null,
            shadowBlur: 0,
          });
        }
      }
    },
  });
};
