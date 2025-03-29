import React, { useState } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  language?: string;
  theme?: string;
}

export default function CodeEditor({ language = "javascript", theme = "vs-dark" }: CodeEditorProps) {
  const [code, setCode] = useState(`// Your code will appear here
function example() {
  console.log("Hello CodeCanvas!");
}`);

  return (
    <div className="flex h-full w-full bg-[#313338]">
      {/* Sidebar (File Explorer) */}
      <div className="w-64 bg-[#2b2d31] border-r border-[#1e1f22] flex flex-col">
        <div className="p-4 border-b border-[#1e1f22] flex items-center justify-between">
          <span className="text-gray-200 font-medium">Files</span>
          <div className="flex gap-2">
            <button className="p-1 text-gray-400 hover:text-white hover:bg-[#404249] rounded">
              ➕
            </button>
            <button className="p-1 text-gray-400 hover:text-white hover:bg-[#404249] rounded">
              👤
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <button className="w-full text-left px-2 py-1.5 rounded flex items-center gap-2 group hover:bg-[#404249] text-gray-300">
            📄 main.tsx
          </button>
          <button className="w-full text-left px-2 py-1.5 rounded flex items-center gap-2 group hover:bg-[#404249] text-gray-300">
            📂 components
          </button>
          <button className="w-full text-left px-2 py-1.5 rounded flex items-center gap-2 group hover:bg-[#404249] text-gray-300">
            📜 package.json
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1">
        <Editor
          height="100vh"
          defaultLanguage={language}
          defaultValue={code}
          theme={theme}
          onChange={(value) => setCode(value || "")}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true,
            formatOnType: true,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            scrollbar: { vertical: "auto", horizontal: "auto" },
          }}
        />
      </div>
    </div>
  );
}
