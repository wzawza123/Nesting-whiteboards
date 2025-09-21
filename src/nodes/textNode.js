import { colors, sizes, styleConfig } from '../config';

export const registerTextNode = (G6) => {
  G6.registerNode('text-only', {
    draw(cfg, group) {
      // 获取样式配置
      const style = cfg.labelCfg?.style || {};
      const fontSize = style.fontSize || styleConfig.fontSize.medium;
      const textColor = style.fill || colors.black;
      
      // 处理多行文本
      const text = cfg.label || 'Text';
      const lines = text.split('\n');
      const lineHeight = fontSize * 1.2; // 行高为字体大小的1.2倍
      
      // 创建文本组
      const textGroup = group.addGroup({
        name: 'text-group'
      });
      
      let maxWidth = 0;
      const textShapes = [];
      
      // 为每一行创建文本形状
      lines.forEach((line, index) => {
        const textShape = textGroup.addShape('text', {
          attrs: {
            text: line,
            x: 0,
            y: (index - (lines.length - 1) / 2) * lineHeight,
            textAlign: 'center',
            textBaseline: 'middle',
            fill: textColor,
            fontSize: fontSize,
            fontFamily: 'Arial',
            cursor: 'move',
          },
          name: `text-line-${index}`,
        });
        textShapes.push(textShape);
        
        // 计算最大宽度
        const bbox = textShape.getBBox();
        maxWidth = Math.max(maxWidth, bbox.width);
      });
      
      // 计算整体文本框
      const totalHeight = lines.length * lineHeight;
      const textBox = {
        x: -maxWidth / 2,
        y: -totalHeight / 2,
        width: maxWidth,
        height: totalHeight
      };
      
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
      
      // 存储文本相关信息到节点配置
      group.set('textInfo', {
        lines: lines.length,
        maxWidth: maxWidth,
        totalHeight: totalHeight,
        lineHeight: lineHeight
      });
      
      return textGroup;
    },

    update(cfg, node) {
      const group = node.getContainer();
      const textGroup = group.find(e => e.get('name') === 'text-group');
      const backgroundRect = group.find(e => e.get('name') === 'text-bg');
      
      if (textGroup) {
        const style = cfg.labelCfg?.style || {};
        const fontSize = style.fontSize || styleConfig.fontSize.medium;
        const textColor = style.fill || colors.black;
        
        // 处理多行文本
        const text = cfg.label || 'Text';
        const lines = text.split('\n');
        const lineHeight = fontSize * 1.2;
        
        // 清除旧的文本行
        const oldTextShapes = textGroup.get('children').filter(child => 
          child.get('name') && child.get('name').startsWith('text-line-'));
        oldTextShapes.forEach(shape => textGroup.removeChild(shape));
        
        let maxWidth = 0;
        
        // 创建新的文本行
        lines.forEach((line, index) => {
          const textShape = textGroup.addShape('text', {
            attrs: {
              text: line,
              x: 0,
              y: (index - (lines.length - 1) / 2) * lineHeight,
              textAlign: 'center',
              textBaseline: 'middle',
              fill: textColor,
              fontSize: fontSize,
              fontFamily: 'Arial',
              cursor: 'move',
            },
            name: `text-line-${index}`,
          });
          
          // 计算最大宽度
          const bbox = textShape.getBBox();
          maxWidth = Math.max(maxWidth, bbox.width);
        });
        
        // 更新背景矩形
        if (backgroundRect) {
          const totalHeight = lines.length * lineHeight;
          const padding = sizes.padding.medium;
          backgroundRect.attr({
            x: -maxWidth / 2 - padding,
            y: -totalHeight / 2 - padding,
            width: maxWidth + (padding * 2),
            height: totalHeight + (padding * 2),
          });
        }
        
        // 更新文本信息
        group.set('textInfo', {
          lines: lines.length,
          maxWidth: maxWidth,
          totalHeight: lines.length * lineHeight,
          lineHeight: lineHeight
        });
      }
    },

    setState(name, value, node) {
      const group = node.getContainer();
      const backgroundRect = group.find(e => e.get('name') === 'text-bg');
      
      if (name === 'selected' && backgroundRect) {
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
