import React, { useEffect, useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { File, Plus } from "lucide-react";
import socket from "../socket";
import { CodeSpaceInfo } from "../../globaltool";

interface CodeFile {
  id: string;
  name: string;
  content: string;
}

export default function CodeEditor({ language = "javascript", theme = "vs-dark" }) {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [newFileName, setNewFileName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);



  useEffect(() => {
    const handleFilesUpdate = ({ files: updatedFiles }: { files: CodeFile[] }) => {
      console.log("Received updated files from server:", updatedFiles);
      setFiles(updatedFiles);
      if (updatedFiles.length > 0 && !activeFileId) {
        setActiveFileId(updatedFiles[0].id);
      }
    };

    socket.on("updateFiles", handleFilesUpdate);
    return () => {
      socket.off("updateFiles", handleFilesUpdate);
    };
  }, [activeFileId]);

  const emitFilesUpdate = useCallback((updatedFiles: CodeFile[]) => {
    console.log("Emitting updated files to server:", updatedFiles);
    socket.emit("updateFiles", { files: updatedFiles, codeSpaceInfo: JSON.stringify(CodeSpaceInfo.currCodeSpaceId) });
  }, []);

  const handleAddFile = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newFileName.trim()) {
      const newFile: CodeFile = {
        id: `file-${Date.now()}`,
        name: newFileName.trim(),
        content: `// ${newFileName.trim()}\n// Start coding here...`,
      };
      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      emitFilesUpdate(updatedFiles);
      setActiveFileId(newFile.id);
      setNewFileName("");
      setIsAdding(false);
    } else if (e.key === "Escape") {
      setNewFileName("");
      setIsAdding(false);
    }
  };

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!value || !activeFileId) return;
      setFiles((prevFiles) => {
        const updatedFiles = prevFiles.map((file) =>
          file.id === activeFileId ? { ...file, content: value } : file
        );
        console.log("File content updated:", updatedFiles);
        emitFilesUpdate(updatedFiles);
        return updatedFiles;
      });
    },
    [activeFileId, emitFilesUpdate]
  );

  const activeFile = files.find((file) => file.id === activeFileId);

  return (
    <div className="flex h-full w-full bg-[#1E1E1E]">
      <div className="w-64 bg-[#252526] border-r border-[#1C1C1C] flex flex-col">
        <div className="p-3 border-b border-[#1C1C1C] flex items-center justify-between">
          <span className="text-[#BBBBBB] text-xs font-medium">FILES</span>
          <button
            onClick={() => setIsAdding(true)}
            className="p-1 text-[#BBBBBB] hover:text-white"
            title="New File"
            aria-label="New File"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {isAdding && (
            <input
              type="text"
              autoFocus
              className="bg-[#3C3C3C] text-white text-xs p-1 rounded w-full"
              placeholder="filename.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={handleAddFile}
              onBlur={() => {
                setNewFileName("");
                setIsAdding(false);
              }}
            />
          )}
          {files.map((file) => (
            <div
              key={file.id}
              className={`flex items-center py-1 px-2 hover:bg-[#2A2D2E] cursor-pointer ${
                activeFileId === file.id ? "bg-[#37373D]" : ""
              }`}
              onClick={() => setActiveFileId(file.id)}
            >
              <File className="w-4 h-4 mr-2 text-[#519ABA]" />
              <span className="text-sm text-[#CCCCCC]">{file.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <Editor
          height="100vh"
          language={language}
          value={activeFile?.content || "// Select or create a file"}
          theme={theme}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: "on",
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
