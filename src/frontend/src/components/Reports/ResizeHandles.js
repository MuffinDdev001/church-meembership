import React from 'react';
import './ResizeHandles.css';

const ResizeHandles = ({ width, height, onResize }) => {
    const handleMouseDown = (direction) => (e) => {
        e.stopPropagation();
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = parseInt(width) || 100;
        const startHeight = parseInt(height) || 0;

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;

            // Calculate new dimensions based on direction
            if (direction.includes('e')) newWidth = Math.max(20, startWidth + deltaX);
            if (direction.includes('w')) newWidth = Math.max(20, startWidth - deltaX);
            if (direction.includes('s')) newHeight = Math.max(10, startHeight + deltaY);
            if (direction.includes('n')) newHeight = Math.max(10, startHeight - deltaY);

            onResize({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="resize-handles">
            {/* Corner handles */}
            <div className="resize-handle nw" onMouseDown={handleMouseDown('nw')} />
            <div className="resize-handle ne" onMouseDown={handleMouseDown('ne')} />
            <div className="resize-handle sw" onMouseDown={handleMouseDown('sw')} />
            <div className="resize-handle se" onMouseDown={handleMouseDown('se')} />

            {/* Edge handles */}
            <div className="resize-handle n" onMouseDown={handleMouseDown('n')} />
            <div className="resize-handle e" onMouseDown={handleMouseDown('e')} />
            <div className="resize-handle s" onMouseDown={handleMouseDown('s')} />
            <div className="resize-handle w" onMouseDown={handleMouseDown('w')} />
        </div>
    );
};

export default ResizeHandles;
