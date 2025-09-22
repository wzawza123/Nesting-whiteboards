import { colors, styleConfig } from '../config';
import { startEditingLabel } from './labelEditor';

export class ContextMenu {
  constructor(graph) {
    this.graph = graph;
    this.menu = this.createContextMenu();
    document.body.appendChild(this.menu);
    this.bindEvents();
  }

  createContextMenu() {
    const menu = document.createElement('div');
    menu.id = 'context-menu';
    menu.className = 'context-menu';
    menu.style.display = 'none';

    // 编辑文本选项
    const editItem = this.createMenuItem('edit', '✏️', 'Edit Text');
    menu.appendChild(editItem);

    // 字体大小选项
    const fontSizeItem = this.createMenuItem('font-size', '📝', 'Font Size');
    const fontSizeSubmenu = this.createSubmenu([
      { size: 12, label: 'Small (12px)' },
      { size: 16, label: 'Medium (16px)' },
      { size: 30, label: 'Large (30px)' },
      { size: 40, label: 'Extra Large (40px)' }
    ]);
    fontSizeItem.appendChild(fontSizeSubmenu);
    menu.appendChild(fontSizeItem);

    // 文本颜色选项
    const textColorItem = this.createMenuItem('text-color', '🎨', 'Text Color');
    const colorSubmenu = this.createColorSubmenu([
      { color: colors.black, label: 'Black' },
      { color: colors.primary, label: 'Blue' },
      { color: colors.success, label: 'Green' },
      { color: colors.error, label: 'Red' },
      { color: colors.purple, label: 'Purple' },
      { color: colors.warning, label: 'Orange' }
    ]);
    textColorItem.appendChild(colorSubmenu);
    menu.appendChild(textColorItem);

    return menu;
  }

  createMenuItem(action, icon, label) {
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.dataset.action = action;
    
    const iconSpan = document.createElement('i');
    iconSpan.className = 'menu-icon';
    iconSpan.textContent = icon;
    
    item.appendChild(iconSpan);
    item.appendChild(document.createTextNode(label));
    
    return item;
  }

  createSubmenu(items) {
    const submenu = document.createElement('div');
    submenu.className = 'submenu';
    
    items.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = 'menu-item';
      menuItem.dataset.size = item.size;
      menuItem.textContent = item.label;
      submenu.appendChild(menuItem);
    });
    
    return submenu;
  }

  createColorSubmenu(items) {
    const submenu = document.createElement('div');
    submenu.className = 'submenu color-submenu';
    
    items.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = 'menu-item color-item';
      menuItem.dataset.color = item.color;
      
      const colorDot = document.createElement('span');
      colorDot.className = 'color-dot';
      colorDot.style.background = item.color;
      
      menuItem.appendChild(colorDot);
      menuItem.appendChild(document.createTextNode(item.label));
      submenu.appendChild(menuItem);
    });
    
    return submenu;
  }

  show(x, y, node) {
    this.menu.style.display = 'block';
    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;
    
    // 存储当前节点引用
    this.menu.dataset.nodeId = node.get('id');
    
    // 获取节点当前样式
    const model = node.getModel();
    const currentFontSize = model.labelCfg?.style?.fontSize || styleConfig.fontSize.medium;
    const currentColor = model.labelCfg?.style?.fill || colors.black;
    
    // 更新字体大小项显示当前大小
    this.menu.querySelectorAll('.submenu .menu-item[data-size]').forEach(item => {
      const size = parseInt(item.dataset.size);
      if (size === currentFontSize) {
        item.style.fontWeight = 'bold';
        item.style.color = colors.primary;
      } else {
        item.style.fontWeight = 'normal';
        item.style.color = colors.black;
      }
    });

    // 更新颜色项显示当前颜色
    this.menu.querySelectorAll('.color-item').forEach(item => {
      const color = item.dataset.color;
      if (color === currentColor) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  hide() {
    this.menu.style.display = 'none';
  }

  bindEvents() {
    // 处理菜单项点击
    this.menu.addEventListener('click', (ev) => {
      const target = ev.target.closest('.menu-item');
      if (!target) return;
      
      const nodeId = this.menu.dataset.nodeId;
      const node = this.graph.findById(nodeId);
      
      if (!node) return;
      
      if (target.dataset.action === 'edit') {
        startEditingLabel(node, this.graph);
      } else if (target.dataset.size) {
        // 更新字体大小
        const fontSize = parseInt(target.dataset.size);
        this.graph.updateItem(node, {
          labelCfg: {
            style: {
              ...node.get('labelCfg')?.style,
              fontSize
            }
          }
        });
      } else if (target.dataset.color) {
        // 更新文本颜色
        const color = target.dataset.color;
        this.graph.updateItem(node, {
          labelCfg: {
            style: {
              ...node.get('labelCfg')?.style,
              fill: color
            }
          }
        });
      }
      
      this.hide();
    });

    // 点击外部隐藏菜单
    document.addEventListener('click', (ev) => {
      if (!ev.target.closest('.context-menu')) {
        this.hide();
      }
    });

    // 按下回车键编辑
    document.addEventListener('keydown', (e) => {
      // 如果正在输入文本，不处理快捷键
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      const selectedItem = this.graph.get('selectedItem');
      if (e.key === 'Enter' && selectedItem && 
          selectedItem.getModel().type !== 'text-only') {
        e.preventDefault();
        startEditingLabel(selectedItem, this.graph);
      }
    });

    // 在画布上点击时隐藏菜单
    this.graph.on('canvas:click', () => {
      this.hide();
    });

    // 在拖拽开始时隐藏菜单
    this.graph.on('dragstart', () => {
      this.hide();
    });
  }
}