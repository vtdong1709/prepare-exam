'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageZoomProps {
  src: string;
  alt?: string;
  className?: string;
}

export default function ImageZoom({ src, alt = "Image", className = "" }: ImageZoomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imageRef = useRef<HTMLImageElement>(null);

  // Reset controls when modal closes/opens
  useEffect(() => {
    if (!isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const next = prev - 0.25;
      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Wheel zoom handling
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    if (e.deltaY < 0) {
      setScale(prev => Math.min(prev + zoomFactor, 5));
    } else {
      setScale(prev => {
        const next = prev - zoomFactor;
        if (next <= 1) {
          setPosition({ x: 0, y: 0 });
          return 1;
        }
        return next;
      });
    }
  };

  // Drag (Pan) handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return; // Only allow panning when zoomed in
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <>
      <div 
        className="relative group cursor-zoom-in overflow-hidden rounded-lg border border-slate-800"
        onClick={() => setIsOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className={`transition-all duration-300 group-hover:scale-[1.01] ${className}`}
        />
        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-full text-cyan-400 shadow-xl flex items-center justify-center">
            <ZoomIn className="h-5 w-5" />
          </div>
        </div>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-sm transition-all duration-300 p-4"
          onWheel={handleWheel}
        >
          {/* Controls Bar at the Top */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-50 pointer-events-none">
            {/* Zoom / Pan Action HUD */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl pointer-events-auto shadow-2xl backdrop-blur-md">
              <button 
                onClick={handleZoomIn}
                title="Phóng to"
                className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-all active:scale-90"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-400 min-w-[40px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={handleZoomOut}
                disabled={scale === 1}
                title="Thu nhỏ"
                className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <div className="w-[1px] h-4 bg-slate-800 mx-1" />
              <button 
                onClick={handleReset}
                disabled={scale === 1 && position.x === 0 && position.y === 0}
                title="Khôi phục"
                className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setIsOpen(false)}
              title="Đóng (Esc)"
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white transition-all hover:bg-slate-800 active:scale-95 pointer-events-auto shadow-2xl backdrop-blur-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Interactive Workspace */}
          <div 
            className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
          >
            <div 
              className="transition-transform duration-75 ease-out select-none pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`
              }}
            >
              <img
                ref={imageRef}
                src={src}
                alt={alt}
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl border border-slate-800/60"
                draggable={false}
              />
            </div>
          </div>
          
          {/* Help Info HUD */}
          <div className="absolute bottom-4 text-center bg-slate-950/80 border border-slate-900 px-4 py-2 rounded-full text-[11px] text-slate-400 backdrop-blur-md pointer-events-none shadow-xl">
            Cuộn chuột để zoom gần xa • Kéo chuột để di chuyển ảnh (khi đã zoom)
          </div>
        </div>
      )}
    </>
  );
}
