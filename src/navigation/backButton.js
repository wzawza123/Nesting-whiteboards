import { colors } from '../config';

export class BackButton {
  constructor(navigation) {
    this.navigation = navigation;
    this.button = this.createBackButton();
    document.body.appendChild(this.button);
    this.bindEvents();
  }

  createBackButton() {
    const button = document.createElement('button');
    button.id = 'backButton';
    button.innerText = '← Back to Parent';
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.display = 'none';
    button.style.padding = '8px 16px';
    button.style.backgroundColor = colors.primary;
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.zIndex = '1000';
    button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    return button;
  }

  update() {
    if (this.navigation.graphStack.length > 0) {
      const parentGraph = this.navigation.graphStack[this.navigation.graphStack.length - 1];
      const parentNode = parentGraph.nodes.find(
        node => node.id === this.navigation.currentGraphData.parentNode
      );
      this.button.innerHTML = `← Back to ${parentNode ? parentNode.label || 'Unnamed' : 'Parent'}`;
      this.button.style.display = 'block';
    } else {
      this.button.style.display = 'none';
    }
  }

  bindEvents() {
    // 返回按钮点击事件
    this.button.addEventListener('click', () => {
      this.navigation.goBack();
    });

    // 返回按钮悬停效果
    this.button.addEventListener('mouseover', () => {
      this.button.style.backgroundColor = '#40a9ff';
    });
    this.button.addEventListener('mouseout', () => {
      this.button.style.backgroundColor = colors.primary;
    });
  }
}