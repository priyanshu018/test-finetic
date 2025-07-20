import React, { useRef, useState } from "react";
import { ZoomOut, RotateCcw, Move, Maximize, Minimize, Minus, Plus, X } from "lucide-react";

interface ZoomableImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt, style }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGuide, setShowGuide] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const adjustZoom = (amount: number) => {
    const newZoom = Math.max(1, Math.min(5, zoom + amount));
    if (newZoom === zoom) return;

    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    if (newZoom > zoom) {
      const scaleFactor = newZoom / zoom;
      const newPosX = (position.x - centerX) * scaleFactor + centerX;
      const newPosY = (position.y - centerY) * scaleFactor + centerY;
      setPosition({ x: newPosX, y: newPosY });
    } else {
      const scaleFactor = newZoom / zoom;
      const newPosX = position.x * scaleFactor;
      const newPosY = position.y * scaleFactor;
      setPosition({ x: newPosX, y: newPosY });
    }

    setZoom(newZoom);
    setShowGuide(true);
    setTimeout(() => setShowGuide(false), 2000);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.003;
    adjustZoom(delta);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      if (containerRef.current) {
        containerRef.current.style.cursor = "grabbing";
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = zoom > 1 ? "grab" : "default";
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    } else {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      setZoom(2);
      setPosition({
        x: (centerX - clickX) * 2,
        y: (centerY - clickY) * 2,
      });
    }
  };

  const resetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setShowGuide(true);
    setTimeout(() => setShowGuide(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl bg-gray-50"
      style={{
        ...style,
        cursor: isDragging ? "grabbing" : zoom > 1 ? "grab" : "default",
        userSelect: "none",
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <img
        src={src}
        alt={alt}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          transformOrigin: "center",
          transition: isDragging ? "none" : "transform 0.2s ease-out",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "none",
        }}
      />

      <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm shadow-sm">
        <Plus className="w-3.5 h-3.5" />
        {Math.round(zoom * 100)}%
      </div>

      <div className="absolute top-3 right-3 transition-opacity opacity-80 hover:opacity-100">
        <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-lg flex gap-1 border border-gray-200">
          <button
            onClick={() => adjustZoom(-0.25)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-700 transition-colors"
            title="Zoom out"
            disabled={zoom <= 1}
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={() => adjustZoom(0.25)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-700 transition-colors"
            title="Zoom in"
            disabled={zoom >= 5}
          >
            <Plus className="w-4 h-4" />
          </button>

          <div className="w-px h-6 my-auto bg-gray-200 mx-0.5"></div>

          <button
            onClick={resetView}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-700 transition-colors"
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-700 transition-colors"
            title="Toggle fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {zoom > 1 && !showGuide && (
        <div className="absolute bottom-12 left-3 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm opacity-80">
          <Move className="w-3 h-3" />
          <span>Drag to pan</span>
        </div>
      )}
    </div>
  );
};

export default ZoomableImage;