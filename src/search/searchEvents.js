export const bindSearchEvents = (graph, nodeSearch) => {
  // 监听 Ctrl+F 快捷键
  document.addEventListener('keydown', (e) => {
    // 如果正在输入文本，不处理快捷键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // 检查是否按下了 Ctrl+F
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault(); // 阻止浏览器默认的查找功能
      nodeSearch.show();
    }
  });
};
