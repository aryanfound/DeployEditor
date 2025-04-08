import React, { useEffect, useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { File, Plus } from "lucide-react";
import socket from "../socket";
import { CodeSpaceInfo } from "../../globaltool";
import { useChange } from "./customhook/spaceinfo";

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
  const [output, setOutput] = useState<string>("");

  const { change, setChange } = useChange();

  // Load Skulpt for Python execution
  useEffect(() => {
    if (!window.hasOwnProperty("Sk")) {
      const skulptScript = document.createElement("script");
      skulptScript.src = "https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js";
      skulptScript.async = true;
      document.body.appendChild(skulptScript);

      const skulptStdlib = document.createElement("script");
      skulptStdlib.src = "https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js";
      skulptStdlib.async = true;
      document.body.appendChild(skulptStdlib);
    }
  }, []);

  const handleFilesUpdate = ({ files: updatedFiles }: { files: CodeFile[] }) => {
    console.log
    console.log("Received updated files from server:", updatedFiles);
    setFiles(updatedFiles);
    if (updatedFiles.length > 0 && !activeFileId) {
      setActiveFileId(updatedFiles[0].id);
    }
  };

  socket.on("filesUpdated", handleFilesUpdate);


  useEffect(() => {
    const handleFilesUpdate = ({ files: updatedFiles }: { files: CodeFile[] }) => {
      console.log
      console.log("Received updated files from server:", updatedFiles);
      setFiles(updatedFiles);
      if (updatedFiles.length > 0 && !activeFileId) {
        setActiveFileId(updatedFiles[0].id);
      }
    };

    
    return () => {
      socket.off("updateFiles", handleFilesUpdate);
    };
  }, [activeFileId]);

  const emitFilesUpdate = useCallback((updatedFiles: CodeFile[]) => {
    console.log("Emitting updated files to server:", updatedFiles);
    socket.emit("updateFiles", { files: updatedFiles, codeSpaceInfo: CodeSpaceInfo.currCodeSpaceId });
  }, []);

  const handleAddFile = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newFileName.trim()) {
      const newFile: CodeFile = {
        id: `file-${Date.now()}`,
        name: newFileName.trim(),
        content: ``,
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

  const getFileLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'py':
        return 'python';
      case 'cpp':
      case 'c++':
        return 'cpp';
      case 'c':
        return 'c';
      default:
        return language;
    }
  };

  const runCode = () => {
    if (!activeFileId) return;
    
    const activeFile = files.find(file => file.id === activeFileId);
    if (!activeFile) return;

    const lang = getFileLanguage(activeFile.name);
    const code = activeFile.content;

    if (lang === "javascript") {
      try {
        const capturedLogs: string[] = [];
        const originalConsoleLog = console.log;
        console.log = (...args) => { capturedLogs.push(args.join(" ")); };
        new Function(code)();
        console.log = originalConsoleLog;
        setOutput(capturedLogs.join("\n") || "Program executed with no output.");
      } catch (error: any) {
        setOutput("Runtime Error: " + error.message);
      }
    } else if (lang === "python") {
      try {
        let capturedLogs: string[] = [];
        if (window.hasOwnProperty("Sk")) {
          // @ts-ignore
          Sk.configure({
            output: (text: string) => { capturedLogs.push(text); },
            read: (x: string) => {
              // @ts-ignore
              if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
                throw "File not found: '" + x + "'";
              // @ts-ignore
              return Sk.builtinFiles["files"][x];
            }
          });
          // @ts-ignore
          Sk.misceval.asyncToPromise(function() {
            // @ts-ignore
            return Sk.importMainWithBody("<stdin>", false, code);
          }).then(function () {
            setOutput(capturedLogs.join("") || "Program executed with no output.");
          }, function (err: any) {
            setOutput("Runtime Error: " + err.toString());
          });
        } else {
          setOutput("Skulpt is not loaded. Python execution not supported.");
        }
      } catch (error: any) {
        setOutput("Runtime Error: " + error.message);
      }
    } else {
      setOutput(`Execution not supported for ${lang} files yet.`);
    }
  };

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
      <div className="flex-1 flex flex-col">
        
        <Editor
          height="60vh"
          language={activeFile ? getFileLanguage(activeFile.name) : language}
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