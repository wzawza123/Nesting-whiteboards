import { sizes } from '../config';

export const bindPasteEvents = (graph) => {
  document.addEventListener('paste', (ev) => {
    const items = ev.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        
        reader.onload = (e) => {
          // 创建临时图片以获取尺寸
          const img = new Image();
          img.onload = () => {
            // 计算保持宽高比的尺寸
            let width = img.width;
            let height = img.height;
            const maxSize = sizes.maxImageSize;
            
            if (width > height) {
              if (width > maxSize) {
                height *= maxSize / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width *= maxSize / height;
                height = maxSize;
              }
            }
            
            // 使用当前鼠标位置进行放置
            const point = graph.get('mousePosition');
            
            // 添加图片节点
            const id = `image-${Date.now()}`;
            graph.addItem('node', {
              id,
              x: point.x,
              y: point.y,
              type: 'image-node',
              img: e.target.result,
              size: [width, height],
            });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  });
};
