import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { Folder, FolderOpen, File, Plus, ChevronDown, ChevronRight, Trash2 } from "lucide-react";

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  content?: string;
  children?: FileItem[];
  isOpen?: boolean;
  parentId?: string | null;
}

export default function CodeEditor({ language = "javascript", theme = "vs-dark" }: { language?: string; theme?: string }) {
  const [code, setCode] = useState(`// Your code will appear here\nfunction example() {\n  console.log("Hello CodeCanvas!");\n}`);
  const [files, setFiles] = useState<FileItem[]>([
    
  ]);

  const [newItem, setNewItem] = useState<{ 
    type: 'file' | 'folder'; 
    parentId: string | null; 
    name: string 
  } | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<Record<string, string>>({});
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    itemId: string | null;
  }>({ visible: false, x: 0, y: 0, itemId: null });

  // File Icons
  const getFileIcon = (item: FileItem) => {
    if (item.type === 'folder') {
      return item.isOpen ? 
        <FolderOpen className="w-[18px] h-[18px] text-[#73C991] mr-2 opacity-90" /> : 
        <Folder className="w-[18px] h-[18px] text-[#73C991] mr-2 opacity-90" />;
    }
    return <File className="w-[18px] h-[18px] text-[#519ABA] mr-2 opacity-90" />;
  };

  // Find item by ID
  const findItem = (items: FileItem[], id: string): FileItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItem(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Toggle folder open/closed
  const toggleFolder = (id: string) => {
    setFiles(prevFiles => 
      updateFiles(prevFiles, id, folder => ({
        ...folder,
        isOpen: !folder.isOpen
      }))
    );
  };

  // Add new file or folder
  const handleAddItem = (type: 'file' | 'folder', parentId: string | null = null) => {
    setIsAdding(true);
    setNewItem({ type, parentId, name: '' });
  };

  // Handle input when adding a file/folder
  const handleItemInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!newItem) return;

    if (e.key === 'Enter' && newItem.name.trim()) {
      const parent = newItem.parentId ? findItem(files, newItem.parentId) : null;
      
      // Check if name already exists
      if (parent?.children?.some(child => child.name === newItem.name.trim())) {
        alert(`${newItem.type === 'folder' ? 'Folder' : 'File'} with this name already exists`);
        return;
      }

      const newItemObj: FileItem = {
        id: `item-${Date.now()}`,
        name: newItem.name.trim(),
        type: newItem.type,
        extension: newItem.type === 'file' ? newItem.name.split('.').pop() : undefined,
        isOpen: false,
        parentId: newItem.parentId,
        content: newItem.type === 'file' ? `// ${newItem.name.trim()}\n` : undefined,
        children: newItem.type === 'folder' ? [] : undefined
      };

      setFiles(prevFiles => {
        if (newItem.parentId) {
          return updateFiles(prevFiles, newItem.parentId, folder => ({
            ...folder,
            children: [...(folder.children || []), newItemObj],
            isOpen: true
          }));
        } else {
          // Add to root if no parent specified
          return prevFiles.map(file => 
            file.id === 'root' 
              ? { ...file, children: [...(file.children || []), newItemObj] }
              : file
          );
        }
      });

      if (newItem.type === 'file') {
        setActiveFile(newItemObj.id);
        setActiveFileContent(prev => ({
          ...prev,
          [newItemObj.id]: newItemObj.content || ''
        }));
        setCode(newItemObj.content || '');
      }

      setNewItem(null);
      setIsAdding(false);
    } else if (e.key === 'Escape') {
      setNewItem(null);
      setIsAdding(false);
    }
  };

  // Update files recursively
  const updateFiles = (files: FileItem[], id: string, updater: (file: FileItem) => FileItem): FileItem[] => {
    return files.map(file => {
      if (file.id === id) return updater(file);
      if (file.children) {
        return {
          ...file,
          children: updateFiles(file.children, id, updater)
        };
      }
      return file;
    });
  };

  // Render File Tree with input field when adding new item
  const renderFiles = (items: FileItem[], depth = 0) => {
    return items.map(item => (
      <div key={item.id} className="pl-4">
        {item.type === 'folder' ? (
          <>
            <div 
              className="flex items-center py-1 px-2 hover:bg-[#2A2D2E] rounded cursor-pointer text-[#CCCCCC] text-sm"
              onClick={() => toggleFolder(item.id)}
            >
              <span className="w-4 mr-1 flex items-center">
                {item.isOpen ? 
                  <ChevronDown className="w-[16px] h-[16px] opacity-80" /> : 
                  <ChevronRight className="w-[16px] h-[16px] opacity-80" />}
              </span>
              {getFileIcon(item)}
              <span className="truncate">{item.name}</span>
            </div>
            {item.isOpen && (
              <div className="pl-4">
                {isAdding && newItem?.parentId === item.id && (
                  <div className="ml-6 my-1">
                    <input
                      type="text"
                      autoFocus
                      className="bg-[#3C3C3C] text-white text-xs p-1 rounded w-full"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      onKeyDown={handleItemInput}
                      onBlur={() => {
                        setNewItem(null);
                        setIsAdding(false);
                      }}
                    />
                  </div>
                )}
                {item.children && renderFiles(item.children, depth + 1)}
                <div className="flex space-x-2 ml-6 mt-1">
                  <button 
                    onClick={() => handleAddItem('file', item.id)}
                    className="flex items-center text-[#A9A9A9] hover:text-white text-xs p-1 rounded hover:bg-[#37373D]"
                    title="New File"
                  >
                    <Plus className="w-3 h-3 mr-1" /> File
                  </button>
                  <button 
                    onClick={() => handleAddItem('folder', item.id)}
                    className="flex items-center text-[#A9A9A9] hover:text-white text-xs p-1 rounded hover:bg-[#37373D]"
                    title="New Folder"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Folder
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div 
            className={`flex items-center py-1 px-2 hover:bg-[#2A2D2E] rounded text-[#CCCCCC] cursor-pointer text-sm ${activeFile === item.id ? 'bg-[#37373D]' : ''}`}
            onClick={() => {
              setActiveFile(item.id);
              setCode(activeFileContent[item.id] || `// ${item.name}\n`);
            }}
          >
            {getFileIcon(item)}
            <span className="truncate">{item.name}</span>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex h-full w-full bg-[#1E1E1E]">
      {/* Sidebar (File Explorer) */}
      <div className="w-64 bg-[#252526] border-r border-[#1C1C1C] flex flex-col">
        <div className="p-3 border-b border-[#1C1C1C] flex items-center justify-between">
          <span className="text-[#BBBBBB] text-xs font-medium">EXPLORER</span>
          <div className="flex space-x-1">
            <button 
              onClick={() => handleAddItem('folder', 'root')} 
              className="p-1 text-[#BBBBBB] hover:text-white hover:bg-[#2A2D2E] rounded"
              title="New Folder"
            >
              <Folder className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleAddItem('file', 'root')} 
              className="p-1 text-[#BBBBBB] hover:text-white hover:bg-[#2A2D2E] rounded"
              title="New File"
            >
              <File className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {isAdding && newItem?.parentId === null && (
            <div className="ml-4 my-1">
              <input
                type="text"
                autoFocus
                className="bg-[#3C3C3C] text-white text-xs p-1 rounded w-full"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                onKeyDown={handleItemInput}
                onBlur={() => {
                  setNewItem(null);
                  setIsAdding(false);
                }}
              />
            </div>
          )}
          {renderFiles(files)}
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1">
        <Editor
          height="100vh"
          language={language}
          value={activeFile ? activeFileContent[activeFile] || '' : code}
          theme={theme}
          onChange={(value) => {
            if (activeFile && value !== undefined) {
              setActiveFileContent(prev => ({
                ...prev,
                [activeFile]: value
              }));
              setCode(value);
            }
          }}
        />
      </div>
    </div>
  );
}