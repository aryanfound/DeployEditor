import React, { useState, useCallback, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { File, Plus, Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import socket from "../socket";
import { CodeSpaceInfo } from "../../globaltool";

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileItem[];
  isOpen?: boolean;
}

export default function CodeEditor({ language = "javascript", theme = "vs-dark" }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [output, setOutput] = useState<string>("");
  const [folder, setFolder] = useState("");
  // Socket.IO handlers
  useEffect(() => {
    const handleFilesUpdate = ({ files: updatedFiles }: { files: FileItem[] }) => {
      console.log("Received updated files from server:", updatedFiles);
      setFiles(updatedFiles);
      if (updatedFiles.length > 0 && !activeFileId) {
        setActiveFileId(updatedFiles[0].id);
      }
      setFolder(CodeSpaceInfo.currspacefolder)
    };

    socket.on("filesUpdated", handleFilesUpdate);
    console.log('hello')
    console.log(CodeSpaceInfo);
    return () => {
      socket.off("filesUpdated", handleFilesUpdate);
    };

  }, [activeFileId]);

  const emitFilesUpdate = useCallback((updatedFiles: FileItem[]) => {
    console.log("Emitting updated files to server:", updatedFiles);
    socket.emit("updateFiles", { 
      files: updatedFiles, 
      codeSpaceInfo: CodeSpaceInfo.currCodeSpaceId 
    });
  }, []);

  // Update file content in the structure
  const updateFileContent = useCallback((id: string, content: string) => {
    setFiles(prev => {
      const updated = updateFileStructure(prev, id, file => ({
        ...file,
        content: content
      }));
      emitFilesUpdate(updated);
      return updated;
    });
  }, [emitFilesUpdate]);

  // Toggle folder open/closed state
  const toggleFolder = (id: string) => {
    setFiles(prev => 
      updateFileStructure(prev, id, file => ({
        ...file,
        isOpen: !file.isOpen
      }))
    );
  };

  // Helper function to recursively update file structure
  const updateFileStructure = (
    files: FileItem[], 
    id: string, 
    updateFn: (file: FileItem) => FileItem
  ): FileItem[] => {
    return files.map(file => {
      if (file.id === id) {
        return updateFn(file);
      }
      if (file.children) {
        return {
          ...file,
          children: updateFileStructure(file.children, id, updateFn)
        };
      }
      return file;
    });
  };

  // Add new file or folder
  const handleAddItem = (e: React.KeyboardEvent<HTMLInputElement>, type: 'file' | 'folder') => {
    const name = type === 'file' ? newFileName : newFolderName;
    if (e.key === "Enter" && name.trim()) {
      const newItem: FileItem = {
        id: `${type}-${Date.now()}`,
        name: name.trim(),
        type,
        ...(type === 'file' ? { content: '' } : { children: [], isOpen: true })
      };

      setFiles(prevFiles => {
        let updatedFiles;
        if (!parentId) {
          updatedFiles = [...prevFiles, newItem];
        } else {
          updatedFiles = updateFileStructure(prevFiles, parentId, folder => ({
            ...folder,
            children: [...(folder.children || []), newItem]
          }));
        }
        emitFilesUpdate(updatedFiles);
        return updatedFiles;
      });

      if (type === 'file') {
        setNewFileName("");
        setActiveFileId(newItem.id);
      } else {
        setNewFolderName("");
      }
      setIsAddingFile(false);
      setIsAddingFolder(false);
      setParentId(null);
    } else if (e.key === "Escape") {
      setNewFileName("");
      setNewFolderName("");
      setIsAddingFile(false);
      setIsAddingFolder(false);
      setParentId(null);
    }
  };

  // Handle editor content changes
  const handleEditorChange = (value: string | undefined, fileId: string) => {
    if (value === undefined || !fileId) return;
    updateFileContent(fileId, value);
  };

  // Run code execution
  const runCode = () => {
    if (!activeFileId) return;
    
    const activeFile = findActiveFile(files, activeFileId);
    if (!activeFile) return;

    const lang = getFileLanguage(activeFile.name);
    const code = activeFile.content || '';

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

  // Render file tree recursively
  const renderFileTree = (items: FileItem[], depth = 0) => {
    return items.map(item => {
      if (item.type === 'folder') {
        return (
          <div key={item.id} className="pl-2">
            <div 
              className={`flex items-center py-1 px-2 hover:bg-[#2A2D2E] cursor-pointer ${depth === 0 ? 'pl-0' : ''}`}
              onClick={() => toggleFolder(item.id)}
            >
              <span className="flex items-center">
                {item.isOpen ? (
                  <ChevronDown className="w-4 h-4 mr-1 text-[#BBBBBB]" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-1 text-[#BBBBBB]" />
                )}
                {item.isOpen ? (
                  <FolderOpen className="w-4 h-4 mr-2 text-[#E2C08D]" />
                ) : (
                  <Folder className="w-4 h-4 mr-2 text-[#E2C08D]" />
                )}
              </span>
              <span className="text-sm text-[#CCCCCC]">{item.name}</span>
              <button 
                className="ml-auto p-1 text-[#BBBBBB] hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setParentId(item.id);
                  setIsAddingFile(true);
                }}
                title="Add File"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button 
                className="p-1 text-[#BBBBBB] hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setParentId(item.id);
                  setIsAddingFolder(true);
                }}
                title="Add Folder"
              >
                <Folder className="w-3 h-3" />
              </button>
            </div>
            {item.isOpen && item.children && (
              <div className="pl-4">
                {renderFileTree(item.children, depth + 1)}
                {(isAddingFile || isAddingFolder) && parentId === item.id && (
                  <input
                    type="text"
                    autoFocus
                    className="bg-[#3C3C3C] text-white text-xs p-1 rounded w-full mt-1"
                    placeholder={isAddingFile ? "filename.js" : "folder name"}
                    value={isAddingFile ? newFileName : newFolderName}
                    onChange={(e) => 
                      isAddingFile 
                        ? setNewFileName(e.target.value) 
                        : setNewFolderName(e.target.value)
                    }
                    onKeyDown={(e) => handleAddItem(e, isAddingFile ? 'file' : 'folder')}
                    onBlur={() => {
                      setNewFileName("");
                      setNewFolderName("");
                      setIsAddingFile(false);
                      setIsAddingFolder(false);
                      setParentId(null);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div
            key={item.id}
            className={`flex items-center py-1 px-2 hover:bg-[#2A2D2E] cursor-pointer ${depth === 0 ? 'pl-0' : 'pl-6'}`}
            onClick={() => setActiveFileId(item.id)}
          >
            <File className="w-4 h-4 mr-2 text-[#519ABA]" />
            <span className="text-sm text-[#CCCCCC]">{item.name}</span>
          </div>
        );
      }
    });
  };

  // Find active file in the structure
  const findActiveFile = (items: FileItem[], id: string | null): FileItem | null => {
    if (!id) return null;
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findActiveFile(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const activeFile = findActiveFile(files, activeFileId);

  // Get language based on file extension
  const getFileLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': case 'jsx': return 'javascript';
      case 'ts': case 'tsx': return 'typescript';
      case 'py': return 'python';
      case 'cpp': case 'c++': return 'cpp';
      case 'c': return 'c';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      default: return language;
    }
  };

  return (
    <div className="flex h-full w-full bg-[#1E1E1E]">
      <div className="w-64 bg-[#252526] border-r border-[#1C1C1C] flex flex-col">
        <div className="p-3 border-b border-[#1C1C1C] flex items-center justify-between">
          <span className="text-[#BBBBBB] text-xs font-medium">FILES</span>
          <div className="flex">
            <button
              onClick={() => {
                setParentId(null);
                setIsAddingFile(true);
              }}
              className="p-1 text-[#BBBBBB] hover:text-white mr-1"
              title="New File"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setParentId(null);
                setIsAddingFolder(true);
              }}
              className="p-1 text-[#BBBBBB] hover:text-white"
              title="New Folder"
            >
              <Folder className="w-4 h-4" />
            </button>
            <button
              onClick={runCode}
              className="p-1 text-[#BBBBBB] hover:text-white ml-1"
              title="Run Code"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {(isAddingFile || isAddingFolder) && !parentId && (
            <input
              type="text"
              autoFocus
              className="bg-[#3C3C3C] text-white text-xs p-1 rounded w-full mb-1"
              placeholder={isAddingFile ? "filename.js" : "folder name"}
              value={isAddingFile ? newFileName : newFolderName}
              onChange={(e) => 
                isAddingFile 
                  ? setNewFileName(e.target.value) 
                  : setNewFolderName(e.target.value)
              }
              onKeyDown={(e) => handleAddItem(e, isAddingFile ? 'file' : 'folder')}
              onBlur={() => {
                setNewFileName("");
                setNewFolderName("");
                setIsAddingFile(false);
                setIsAddingFolder(false);
              }}
            />
          )}
          {renderFileTree(files)}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <Editor
          height="80%"
          language={activeFile ? getFileLanguage(activeFile.name) : language}
          value={activeFile?.content || "// Select or create a file"}
          theme={theme}
          onChange={(value) => activeFileId && handleEditorChange(value, activeFileId)}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: "on",
            automaticLayout: true,
          }}
        />
        <div className="h-20% bg-[#1E1E1E] border-t border-[#1C1C1C] p-2 overflow-auto">
          <pre className="text-xs text-[#CCCCCC]">{output}</pre>
        </div>
      </div>
    </div>
  );
}