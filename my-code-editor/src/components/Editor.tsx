import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { MonacoBinding } from "y-monaco"; 
import * as Y from "yjs";
import { WebsocketProvider } from 'y-websocket';
import { v4 as uuidv4 } from "uuid";
import { CodeSpaceInfo } from "../../globaltool";
import {useChange} from "../components/customhook/spaceinfo";
import create_YSocket from "./yjs";
import {
  File,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Users,
  Save
} from "lucide-react";

let ydoc = new Y.Doc(); // Export for posting function
let yfileMap = ydoc.getMap("fileMap");
let yrootItems = ydoc.getArray("rootItems");
let yprovider = create_YSocket(ydoc); // Create a single provider instance

export default function CollaborativeEditor({ projectId }) {
  const [files, setFiles] = useState(new Map());
  const [newItemName, setNewItemName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [activeFileId, setActiveFileId] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [newItemType, setNewItemType] = useState("file");
  const [userCount, setUserCount] = useState(1);
  const editorRef = useRef(null);
  const bindingRef = useRef(null);
  const modelsRef = useRef(new Map());
  const { change } = useChange();

  const token = localStorage.getItem("token");

  const handleAwarenessChange = () => {
    setUserCount(yprovider.awareness.getStates().size);
  };

  const reconnectYjs = () => {
    // Clean up old connections
    if (yprovider) yprovider.destroy();
    if (ydoc) ydoc.destroy();

    // Reinitialize Yjs document and structures
    ydoc = new Y.Doc();
    yfileMap = ydoc.getMap("fileMap");
    yrootItems = ydoc.getArray("rootItems");

    // Create new provider (socket connection)
    yprovider = create_YSocket(ydoc);

    // Set up awareness or listeners
    yprovider.awareness.on("change", handleAwarenessChange);

    // Observe changes in Yjs documents
    const observer = () => {
      const fileMap = new Map();
      yrootItems.forEach((id) => {
        const yitem = yfileMap.get(id);
        if (yitem) {
          fileMap.set(id, convertYItemToJS(yitem));
        }
      });
      setFiles(fileMap);
    };

    yfileMap.observeDeep(observer);
    yrootItems.observe(observer);

    // Call observer initially to populate files
    observer();

    // Set initial awareness state
    yprovider.awareness.setLocalState({
      user: token || "anonymous",
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    });

    // Clean up on unmount
    return () => {
      yfileMap.unobserveDeep(observer);
      yrootItems.unobserve(observer);
      yprovider.awareness.off("change", handleAwarenessChange);
      yprovider.awareness.setLocalState(null);
      modelsRef.current.forEach((model) => model.dispose());
      modelsRef.current.clear();
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  };

  useEffect(() => {
    reconnectYjs();
  }, [change]);

  const setupEditorBinding = (fileId) => {
    if (!editorRef.current || !fileId) return;

    const yfile = yfileMap.get(fileId);
    if (!yfile || yfile.get("type") !== "file") return;

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    let model;
    if (modelsRef.current.has(fileId)) {
      model = modelsRef.current.get(fileId);
    } else {
      const ytext = yfile.get("content");
      const modelUri = monaco.Uri.parse(`file:///${fileId}/${yfile.get("name")}`);
      model = monaco.editor.createModel(
        ytext.toString(),
        undefined,
        modelUri
      );
      modelsRef.current.set(fileId, model);
    }

    editorRef.current.setModel(model);

    const ytext = yfile.get("content");
    bindingRef.current = new MonacoBinding(
      ytext,
      model,
      new Set([editorRef.current]),
      yprovider.awareness
    );

    yprovider.awareness.setLocalState({
      ...yprovider.awareness.getLocalState(),
      editing: fileId,
      user: token || "anonymous",
    });
  };

  useEffect(() => {
    if (activeFileId) {
      setupEditorBinding(activeFileId);
    }
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [activeFileId]);

  const convertYItemToJS = (yitem) => {
    if (!yitem) return null;
    
    const item = {};
    yitem.forEach((value, key) => {
      if (value instanceof Y.Array) {
        item[key] = value.toArray();
      } else if (value instanceof Y.Text) {
        item[key] = value.toString();
      } else {
        item[key] = value;
      }
    });
    return item;
  };

  const getChildItems = (parentId) => {
    const childItems = new Map();
    const parent = yfileMap.get(parentId);
    if (!parent || !parent.get("children")) return childItems;

    parent.get("children").forEach(childId => {
      const child = yfileMap.get(childId);
      if (child) {
        childItems.set(childId, convertYItemToJS(child));
      }
    });
    return childItems;
  };

  const handleAddItem = (e) => {
    if (e.key === "Enter" && newItemName.trim()) {
      const newId = uuidv4();
      const yitem = new Y.Map();
      
      yitem.set("id", newId);
      yitem.set("name", newItemName.trim());
      yitem.set("type", newItemType);
      yitem.set("parentId", parentId);
      
      if (newItemType === "file") {
        const ytext = new Y.Text();
        yitem.set("content", ytext);
        
        const modelUri = monaco.Uri.parse(`file:///${newId}/${newItemName.trim()}`);
        const model = monaco.editor.createModel(
          ytext.toString(),
          getLanguageFromFilename(newItemName.trim()),
          modelUri
        );
        modelsRef.current.set(newId, model);
      } else {
        yitem.set("children", new Y.Array());
        yitem.set("isOpen", true);
      }

      yfileMap.set(newId, yitem);
      
      if (parentId) {
        const parent = yfileMap.get(parentId);
        if (parent) {
          parent.get("children").push([newId]);
        }
      } else {
        yrootItems.push([newId]);
      }

      setNewItemName("");
      setIsAdding(false);
      setParentId(null);
      
      if (newItemType === "file") {
        setActiveFileId(newId);
      }
    }

    if (e.key === "Escape") {
      setNewItemName("");
      setIsAdding(false);
      setParentId(null);
    }
  };

  const getLanguageFromFilename = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const langMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'py': 'python',
      'md': 'markdown',
      'java': 'java',
      'cpp': 'cpp',
    };
    return langMap[ext] || undefined;
  };

  const toggleFolder = (folderId) => {
    const yfolder = yfileMap.get(folderId);
    if (yfolder) {
      yfolder.set("isOpen", !yfolder.get("isOpen"));
    }
  };

  const deleteItem = (itemId) => {
    const yitem = yfileMap.get(itemId);
    if (!yitem) return;

    const parentId = yitem.get("parentId");
    
    if (parentId) {
      const parent = yfileMap.get(parentId);
      if (parent) {
        const children = parent.get("children");
        const index = children.toArray().indexOf(itemId);
        if (index !== -1) {
          children.delete(index, 1);
        }
      }
    } else {
      const index = yrootItems.toArray().indexOf(itemId);
      if (index !== -1) {
        yrootItems.delete(index, 1);
      }
    }

    if (yitem.get("type") === "folder") {
      yitem.get("children").forEach(childId => {
        deleteItem(childId);
      });
    }

    yfileMap.delete(itemId);

    if (modelsRef.current.has(itemId)) {
      modelsRef.current.get(itemId).dispose();
      modelsRef.current.delete(itemId);
    }

    if (activeFileId === itemId && bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    if (activeFileId === itemId) {
      setActiveFileId(null);
    }
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    
    if (activeFileId) {
      setupEditorBinding(activeFileId);
    }
  };

  useEffect(() => {
    if (!activeFileId) return;
    
    if (editorRef.current) {
      setupEditorBinding(activeFileId);
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [activeFileId]);

  useEffect(() => {
    reconnectYjs();
  }, [projectId]);

  const renderFileTree = (items, depth = 0) => {
    return Array.from(items)
      .filter(([id, item]) => item !== null)
      .map(([id, item]) => {
        if (!item?.type) return null;

        const paddingLeft = `${12 + depth * 12}px`;
        
        if (item.type === "folder") {
          return (
            <div key={id}>
              <div
                className="flex items-center py-1 px-2 hover:bg-[#2A2D2E] rounded cursor-pointer text-[#CCCCCC] text-sm group"
                style={{ paddingLeft }}
                onClick={() => toggleFolder(id)}
              >
                <span className="w-4 mr-1 flex items-center">
                  {item.isOpen ? 
                    <ChevronDown className="w-[16px] h-[16px] opacity-80" /> : 
                    <ChevronRight className="w-[16px] h-[16px] opacity-80" />}
                </span>
                {item.isOpen ? 
                  <FolderOpen className="w-[18px] h-[18px] text-[#73C991] mr-2 opacity-90" /> :
                  <Folder className="w-[18px] h-[18px] text-[#73C991] mr-2 opacity-90" />}
                <span className="truncate">{item.name}</span>
                <div className="ml-auto hidden group-hover:flex items-center space-x-1">
                  <button 
                    className="p-1 text-[#BBBBBB] hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setParentId(id);
                      setNewItemType("file");
                      setIsAdding(true);
                    }}
                    title="Add File"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button 
                    className="p-1 text-[#BBBBBB] hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setParentId(id);
                      setNewItemType("folder");
                      setIsAdding(true);
                    }}
                    title="Add Folder"
                  >
                    <Folder className="w-3 h-3" />
                  </button>
                  <button 
                    className="p-1 text-[#BBBBBB] hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(id);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              {item.isOpen && (
                <div className="pl-4">
                  {isAdding && parentId === id && (
                    <div className="ml-6 my-1">
                      <input
                        type="text"
                        autoFocus
                        className="bg-[#3C3C3C] text-white text-xs p-1 rounded w-full"
                        placeholder={`New ${newItemType} name`}
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={handleAddItem}
                        onBlur={() => {
                          setNewItemName("");
                          setIsAdding(false);
                          setParentId(null);
                        }}
                      />
                    </div>
                  )}
                  {renderFileTree(getChildItems(id), depth + 1)}
                </div>
              )}
            </div>
          );
        } else {
          const editors = Array.from(yprovider.awareness.getStates().entries())
            .filter(([_, state]) => state?.editing === id)
            .map(([_, state]) => state?.user);

          const isBeingEditedByOthers =
            editors.length > 0 &&
            !editors.includes(yprovider.awareness.clientID);

          return (
            <div
              key={id}
              className={`flex items-center py-1 px-2 hover:bg-[#2A2D2E] rounded text-[#CCCCCC] cursor-pointer text-sm group ${
                activeFileId === id ? "bg-[#37373D]" : ""
              }`}
              style={{ paddingLeft }}
              onClick={() => setActiveFileId(id)}
            >
              <File
                className={`w-[18px] h-[18px] ${
                  isBeingEditedByOthers
                    ? "text-[#F9A825]"
                    : "text-[#519ABA]"
                } mr-2 opacity-90`}
              />
              <span className="truncate">{item.name}</span>
              {editors.map((user, index) => (
                <span
                  key={index}
                  className="ml-2 text-xs text-[#F9A825]"
                  title={`Editing: ${user}`}
                >
                  {user}
                </span>
              ))}
              <div className="ml-auto hidden group-hover:flex">
                <button 
                  className="p-1 text-[#BBBBBB] hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem(id);
                  }}
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        }
      });
  };

  return (
    <div className="flex h-screen w-full bg-[#1E1E1E]">
      <div className="w-64 bg-[#252526] border-r border-[#1C1C1C] flex flex-col">
        <div className="p-3 border-b border-[#1C1C1C] flex items-center justify-between">
          <span className="text-[#BBBBBB] text-xs font-medium">EXPLORER</span>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-[#BBBBBB] text-xs">
              <Users className="w-3 h-3 mr-1" />
              <span>{userCount}</span>
            </div>
            <div className="flex space-x-1">
              <button 
                onClick={() => {
                  setParentId(null);
                  setNewItemType("file");
                  setIsAdding(true);
                }} 
                className="p-1 text-[#BBBBBB] hover:text-white hover:bg-[#2A2D2E] rounded"
                title="New File"
              >
                <File className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  setParentId(null);
                  setNewItemType("folder");
                  setIsAdding(true);
                }} 
                className="p-1 text-[#BBBBBB] hover:text-white hover:bg-[#2A2D2E] rounded"
                title="New Folder"
              >
                <Folder className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {isAdding && parentId === null && (
            <div className="ml-4 my-1">
              <input
                type="text"
                autoFocus
                className="bg-[#3C3C3C] text-white text-xs p-1 rounded w-full"
                placeholder={`New ${newItemType} name`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={handleAddItem}
                onBlur={() => {
                  setNewItemName("");
                  setIsAdding(false);
                }}
              />
            </div>
          )}
          
          {renderFileTree(new Map(
            Array.from(yrootItems)
              .map(id => [id, convertYItemToJS(yfileMap.get(id))])
              .filter(([id, item]) => item !== null)
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {activeFileId ? (
          <Editor
            height="100%"
            language={getLanguageFromFilename(yfileMap.get(activeFileId)?.get("name") || "")}
            theme="vs-dark"
            onMount={handleEditorMount}
            options={{
              fontSize: 14,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-[#BBBBBB]">
            Select a file to start editing
          </div>
        )}
      </div>
    </div>
  );
}