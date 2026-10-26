import React, { useRef, useCallback } from 'react';

/**
 * A <th> that can be dragged on its right edge to resize the column.
 * Usage:
 *   <ResizableTh width={colWidths.date} onResize={w => setColWidths(p => ({...p, date: w}))} className="...">
 *     Date
 *   </ResizableTh>
 */
const ResizableTh = ({ width, onResize, children, className = '', style = {} }) => {
  const thRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(40, startWidth + delta);
      onResize(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [width, onResize]);

  return (
    <th
      ref={thRef}
      scope="col"
      className={`relative px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none ${className}`}
      style={{ width, minWidth: 40, ...style }}
    >
      <div className="flex items-center gap-1 overflow-hidden">
        {children}
      </div>
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 h-full w-2 cursor-col-resize flex items-center justify-center group"
        title="Drag to resize"
      >
        <div className="w-0.5 h-4 bg-gray-300 group-hover:bg-blue-400 rounded transition-colors" />
      </div>
    </th>
  );
};

export default ResizableTh;
