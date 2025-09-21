import React, { useState, useRef } from 'react';
import { Image } from 'antd';
import { createRoot } from 'react-dom/client';

const ImagePreviewComponent = ({ src, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // 在组件挂载时禁用滚动，卸载时恢复
  React.useEffect(() => {
    // 保存原始样式
    const originalStyle = window.getComputedStyle(document.body).overflow;
    // 禁用滚动
    document.body.style.overflow = 'hidden';
    
    // 组件卸载时恢复
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prevScale => {
      const newScale = Math.min(Math.max(prevScale + delta, 0.1), 5);
      return newScale;
    });
  };

  const handleMouseDown = (e) => {
    if (e.target === containerRef.current) return;
    e.preventDefault();
    isDragging.current = true;
    startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.target.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const newX = e.clientX - startPos.current.x;
    const newY = e.clientY - startPos.current.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = (e) => {
    isDragging.current = false;
    if (e.target !== containerRef.current) {
      e.target.style.cursor = 'grab';
    }
  };

  const handleBackgroundClick = (e) => {
    if (e.target === containerRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        userSelect: 'none'
      }}
      onClick={handleBackgroundClick}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 关闭按钮 */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          zIndex: 1001
        }}
        onClick={onClose}
      >
        ×
      </div>

      {/* 缩放信息 */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          color: 'white',
          fontSize: '14px',
          zIndex: 1001
        }}
      >
        {Math.round(scale * 100)}%
      </div>

      <Image
        src={src}
        preview={false}
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          cursor: isDragging.current ? 'grabbing' : 'grab',
          maxWidth: '90vw',
          maxHeight: '90vh',
          objectFit: 'contain',
          transition: isDragging.current ? 'none' : 'transform 0.1s'
        }}
        onMouseDown={handleMouseDown}
        draggable={false}
      />
    </div>
  );
};

export const showImagePreview = (imgSrc) => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);
  const handleClose = () => {
    root.unmount();
    document.body.removeChild(container);
  };

  root.render(
    <ImagePreviewComponent
      src={imgSrc}
      onClose={handleClose}
    />
  );
};
