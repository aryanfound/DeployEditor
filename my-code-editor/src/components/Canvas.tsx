import React, { useState } from 'react';
import { Undo, Redo, Square, Circle, Type } from 'lucide-react';
import { Panel, PanelResizeHandle } from 'react-resizable-panels';

export function Canvas() {
  const [width, setWidth] = useState(50);

  return (
    <Panel
      className="bg-[#313338] border-l border-[#1e1f22]"
      defaultSize={width}
      minSize={30}
      maxSize={70}
      onResize={setWidth}
    >
      <div className="h-12 bg-[#2b2d31] border-b border-[#1e1f22] flex items-center px-4 gap-4">
        <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#404249] rounded transition-colors">
          <Undo className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#404249] rounded transition-colors">
          <Redo className="w-4 h-4" />
        </button>
        <div className="h-6 w-px bg-[#1e1f22]" />
        <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#404249] rounded transition-colors">
          <Square className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#404249] rounded transition-colors">
          <Circle className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#404249] rounded transition-colors">
          <Type className="w-4 h-4" />
        </button>
      </div>
      <div className="w-full h-[calc(100vh-3.5rem)] bg-[#313338] overflow-auto" />
      <PanelResizeHandle className="w-1 hover:bg-blue-500 transition-colors" />
    </Panel>
  );
}