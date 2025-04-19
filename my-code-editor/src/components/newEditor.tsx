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

    let ydoc = new Y.Doc();//export for posting function
    let yfileMap = ydoc.getMap("fileMap");
    let yrootItems = ydoc.getArray("rootItems");
    // Create a single provider instance that will be shared throughout the app
    let  yprovider = create_YSocket(ydoc);

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
  const {change} = useChange();

  // Create Yjs document and setup global provider for sync
    const token = localStorage.getItem("token");
   
 
  // Track editor models to dispose them properly
  const modelsRef = useRef(new Map());

  const handleAwarenessChange = () => {
    setUserCount(yprovider.awareness.getStates().size);
    //const states= yprovider.awareness.getStates().values()
    
  };

  useEffect(() => {
   
    console.log('codespace changed');

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
    handleAwarenessChange();
    
    // Update the active file's content if it changed
    if (activeFileId) {
      const yfile = yfileMap.get(activeFileId);
      if (yfile && editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          // Ensure the binding is intact
          if (!bindingRef.current) {
            setupEditorBinding(activeFileId);
          }
        }
      }
    }
  }, [change, activeFileId]);

  // Setup editor binding function to be reused
  const setupEditorBinding = (fileId) => {
    if (!editorRef.current || !fileId) return;

    const yfile = yfileMap.get(fileId);
    if (!yfile || yfile.get("type") !== "file") return;

    // Clean up previous binding if exists
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    // Get or create model for this file
    let model;
    if (modelsRef.current.has(fileId)) {
      model = modelsRef.current.get(fileId);
    } else {
      const ytext = yfile.get("content");
      const modelUri = monaco.Uri.parse(`file:///${fileId}/${yfile.get("name")}`);
      model = monaco.editor.createModel(
        ytext.toString(),
        undefined, // language will be inferred
        modelUri
      );
      modelsRef.current.set(fileId, model);
    }

    // Ensure the editor instance is valid
    if (!editorRef.current) {
      console.error("Editor instance is not available.");
      return;
    }

    // Set the model to the editor
    editorRef.current.setModel(model);

    // Create new binding with the shared ytext and editor
    const ytext = yfile.get("content");
    bindingRef.current = new MonacoBinding(
      ytext,
      model,
      new Set([editorRef.current]),
      yprovider.awareness
    );

    // Notify others that content may have changed
    yprovider.awareness.setLocalState({
      ...yprovider.awareness.getLocalState() || {},
      editing: fileId,
      user: token || 'anonymous'
    });
  };

  // Convert Yjs item to plain JS object
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

  // Get all child items
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

  // Handle adding new items
  const handleAddItem = (e) => {
    if (e.key === "Enter" && newItemName.trim()) {
      const newId = uuidv4();
      const yitem = new Y.Map();
      
      yitem.set("id", newId);
      yitem.set("name", newItemName.trim());
      yitem.set("type", newItemType);
      yitem.set("parentId", parentId);
      
      if (newItemType === "file") {
        // Create a new Y.Text for file content
        const ytext = new Y.Text();
        yitem.set("content", ytext);
        
        // Create a Monaco model for this file
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

      // Add to Yjs (automatically syncs via provider)
      yfileMap.set(newId, yitem);
      
      if (parentId) {
        const parent = yfileMap.get(parentId);
        if (parent) {
          parent.get("children").push([newId]);
        }
      } else {
        yrootItems.push([newId]);
      }

      // Reset UI state
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

  // Helper to determine language from filename
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

  // Toggle folder open/closed
  const toggleFolder = (folderId) => {
    const yfolder = yfileMap.get(folderId);
    if (yfolder) {
      yfolder.set("isOpen", !yfolder.get("isOpen"));
    }
  };

  // Delete an item
  const deleteItem = (itemId) => {
    const yitem = yfileMap.get(itemId);
    if (!yitem) return;

    const parentId = yitem.get("parentId");
    
    // Remove from parent or root
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

    // Clean up children if folder
    if (yitem.get("type") === "folder") {
      yitem.get("children").forEach(childId => {
        deleteItem(childId);
      });
    }

    // Remove from map
    yfileMap.delete(itemId);

    // Clean up Monaco model if it's a file
    if (modelsRef.current.has(itemId)) {
      modelsRef.current.get(itemId).dispose();
      modelsRef.current.delete(itemId);
    }

    // Clean up any active binding
    if (activeFileId === itemId && bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    // Clear editor if deleting active file
    if (activeFileId === itemId) {
      setActiveFileId(null);
    }
  };

  // Handle editor mount
  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    
    // Setup binding if we already have an active file
    if (activeFileId) {
      setupEditorBinding(activeFileId);
    }
  };

  // Cleanup on unmount or file change
  useEffect(() => {
    if (!activeFileId) return;

    // Wait for editor to be ready
    if (editorRef.current) {
      setupEditorBinding(activeFileId);
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }

      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          model.dispose();
        }
      }
    };
  }, [activeFileId]);

  // Initialize Yjs synchronization
  useEffect(() => {
   
    const observer = () => {
      
     
      const fileMap = new Map();
      yrootItems.forEach(id => {
        const yitem = yfileMap.get(id);
        if (yitem) {
          fileMap.set(id, convertYItemToJS(yitem));
        }
      });
      setFiles(fileMap);
    };

    // Observe changes in Yjs documents
    yfileMap.observeDeep(observer);
    yrootItems.observe(observer);
    
    // Monitor user awareness
    yprovider.awareness.on('change', handleAwarenessChange);
    
    // Call observer initially to populate files
    observer();
    
    // Set initial awareness state
    yprovider.awareness.setLocalState({
      user: token || 'anonymous',
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
    });

    // Clean up models on unmount
    return () => {
      yfileMap.unobserveDeep(observer);
      yrootItems.unobserve(observer);
      yprovider.awareness.off('change', handleAwarenessChange);
      
      // Clear local awareness state
      yprovider.awareness.setLocalState(null);
      
      // Dispose all models
      modelsRef.current.forEach(model => model.dispose());
      modelsRef.current.clear();
      
      // Clean up any active binding
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };

  }, [projectId]);

  // Revert code function
  const revertCode = (newCode) => {
    if (!activeFileId) return;
  
    const yfile = yfileMap.get(activeFileId);
    if (!yfile || yfile.get("type") !== "file") return;
  
    // Reset the Y.Text content with the new code
    const ytext = yfile.get("content");
    ytext.delete(0, ytext.length); // Clear existing content
    ytext.insert(0, newCode); // Insert new content
  
    // Ensure the editor reflects the updated content
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        model.setValue(newCode);
      }
    }
  };
  
  // Example usage of revertCode
  const handleRevert = () => {
    const newCode = "// This is the reverted code"; // Replace with the desired reverted code
    revertCode(newCode);
  };

  // Render the file tree (same as before)
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
          // Get the users editing this file
          const editors = Array.from(yprovider.awareness.getStates().entries())
            .filter(([_, state]) => state?.editing === id)
            .map(([clientId, _]) => clientId);
          
          const isBeingEditedByOthers = editors.length > 0 && 
            !editors.includes(yprovider.awareness.clientID);
          
          return (
            <div
              key={id}
              className={`flex items-center py-1 px-2 hover:bg-[#2A2D2E] rounded text-[#CCCCCC] cursor-pointer text-sm group ${
                activeFileId === id ? 'bg-[#37373D]' : ''
              }`}
              style={{ paddingLeft }}
              onClick={() => setActiveFileId(id)}
            >
              <File className={`w-[18px] h-[18px] ${isBeingEditedByOthers ? 'text-[#F9A825]' : 'text-[#519ABA]'} mr-2 opacity-90`} />
              <span className="truncate">{item.name}</span>
              {isBeingEditedByOthers && (
                <span className="ml-2 text-xs text-[#F9A825]">{editors.length}</span>
              )}
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
      {/* File Explorer Sidebar */}
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

      {/* Editor Area */}
      <div className="flex-1 flex flex-col">
        <button
          onClick={handleRevert}
          className="p-2 bg-[#5865f2] text-white rounded hover:bg-[#4752c4] mb-2"
        >
          Revert Code
        </button>
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