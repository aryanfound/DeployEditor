import React, { useState, useEffect, useRef, useCallback } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { motion, AnimatePresence } from "framer-motion";
import { markdown } from "@codemirror/lang-markdown";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import {vscodeDark} from "@uiw/codemirror-theme-vscode"
import { yCollab } from "y-codemirror.next";
import { v4 as uuidv4 } from "uuid";
import { CodeSpaceInfo } from "../../globaltool";
import { useChange } from "../components/customhook/spaceinfo";
import create_YSocket from "./yjs";
import { ChatIcon } from './modals/chatIcon';
import { ChatPanel } from './modals/Chat';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import { FitAddon } from 'xterm-addon-fit';
import {
  File,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Users,
  Play,
} from "lucide-react";
import { getDoc } from "./functions/yjsExport";
import clearYDoc from "./functions/clearYdoc";
import performDocumentReset from "./functions/restoreCode";

type FileItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  content?: string;
  children?: string[];
  isOpen?: boolean;
};

type FileMap = Map<string, FileItem>;

export let ydoc: Y.Doc | null = null;
let yfileMap: Y.Map<Y.Map<any>> | null = null;
let yrootItems: Y.Array<string> | null = null;
export let yprovider: WebsocketProvider | null = null;

export function getYDoc(): Y.Doc | null {
  return ydoc;
}

const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const CollaborativeEditor: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [files, setFiles] = useState<FileMap>(new Map());
  const [newItemName, setNewItemName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [newItemType, setNewItemType] = useState<"file" | "folder">("file");
  const [userCount, setUserCount] = useState(1);
  const editorRef = useRef<EditorView | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const viewsRef = useRef<Map<string, EditorView>>(new Map());
  const { change, codeChange, setCodeChange, readyYjs, setreadyYjs } = useChange();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [isDragging, setIsDragging] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const term = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    text: string;
    sender: string;
    timestamp: Date;
  }>>([
    {
      id: '1',
      text: 'Welcome to the chat!',
      sender: 'system',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const activeFile = useRef<string | null>(null);

  const token = localStorage.getItem("username");

  const safeTerminalWrite = (text: string) => {
    if (term.current) {
      term.current.writeln(text);
      term.current.refresh(0, term.current.rows - 1);
    }
  };

  const executeJavaScript = useCallback((code: string) => {
    safeTerminalWrite('\n[Running code...]');
  
    const customConsole = {
      log: (...args: any[]) => safeTerminalWrite(`[LOG] ${args.join(' ')}`),
      error: (...args: any[]) => safeTerminalWrite(`[ERROR] ${args.join(' ')}`),
      warn: (...args: any[]) => safeTerminalWrite(`[WARN] ${args.join(' ')}`),
      info: (...args: any[]) => safeTerminalWrite(`[INFO] ${args.join(' ')}`),
    };
  
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const func = new AsyncFunction('console', `"use strict";\ntry { ${code} } catch (err) { console.error(err); throw err; }`);
  
    try {
      func(customConsole)
        .then((res: any) => {
          if (res !== undefined) {
            safeTerminalWrite(`[Result] ${JSON.stringify(res, null, 2)}`);
          }
        })
        .catch((err: any) => {
          safeTerminalWrite(`[Execution Error] ${err instanceof Error ? err.message : String(err)}`);
        });
    } catch (error) {
      safeTerminalWrite(`[Fatal Error] ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);
  
  const handleSave = () => {
    if (!activeFileId) {
      console.warn("No active file selected for saving.");
      return;
    }
  }

  const runActiveFile = useCallback(() => {
    if (!activeFileId) {
      safeTerminalWrite("[Error] No active file selected to run.");
      return;
    }
  
    const view = viewsRef.current.get(activeFileId);
    if (!view) {
      safeTerminalWrite("[Error] Editor not ready.");
      return;
    }
  
    const code = view.state.doc.toString();
    if (!code.trim()) {
      safeTerminalWrite("[Error] The file is empty.");
      return;
    }
  
    safeTerminalWrite(`\n[Executing ${files.get(activeFileId)?.name || 'file'}...]`);
    executeJavaScript(code)
      .catch(() => {}); // Errors are already handled in executeJavaScript
  }, [activeFileId, executeJavaScript, files]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: token || "Anonymous",
        timestamp: new Date(),
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleAwarenessChange = () => {
    if (yprovider?.awareness) {
      setUserCount(yprovider.awareness.getStates().size);
    }
  };

  const convertYItemToJS = (yitem: Y.Map<any>): FileItem => {
    const item: FileItem = {
      id: yitem.get("id"),
      name: yitem.get("name"),
      type: yitem.get("type"),
      parentId: yitem.get("parentId"),
    };

    if (item.type === "file") {
      const content = yitem.get("content");
      item.content = content?.toString() || "";
    } else {
      const children = yitem.get("children");
      item.children = children?.toArray() || [];
      item.isOpen = yitem.get("isOpen") || false;
    }

    return item;
  };

  const debouncedObserver = useRef(
    debounce(() => {
      try {
        const fileMap: FileMap = new Map();
        
        if (yrootItems && yfileMap) {
          yrootItems.forEach((id: string) => {
            const yitem = yfileMap?.get(id);
            if (yitem) {
              fileMap.set(id, convertYItemToJS(yitem));
            }
          });
        }
        
        setFiles(fileMap);
      } catch (error) {
        console.error("Error observing Yjs changes:", error);
      }
    }, 100)
  ).current;

  const observer = () => {
    debouncedObserver();
  };

  const getChildItems = (parentId: string): FileMap => {
    const childItems: FileMap = new Map();
    const parent = yfileMap?.get(parentId);
    
    if (parent?.get("children")) {
      parent.get("children").forEach((childId: string) => {
        const child = yfileMap?.get(childId);
        if (child) {
          childItems.set(childId, convertYItemToJS(child));
        }
      });
    }
    
    return childItems;
  };

  const reconnectYjs = () => {
    if (yprovider) {
      yprovider.destroy();
    }
    
    if (!ydoc) {
      ydoc = new Y.Doc();
    }
    
    yfileMap = ydoc.getMap("fileMap");
    yrootItems = ydoc.getArray("rootItems");
    
    yprovider = create_YSocket({ydoc, setreadyYjs});
    
    if (yprovider?.awareness) {
      yprovider.awareness.on("change", handleAwarenessChange);
      yprovider.awareness.setLocalState({
        user: token || "anonymous",
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      });
    }
    
    yfileMap.observeDeep(observer);
    yrootItems.observe(observer);
    
    observer();
  };

  const getLanguageExtension = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, any> = {
      'js': javascript(),
      'jsx': javascript({ jsx: true }),
      'ts': javascript({ typescript: true }),
      'tsx': javascript({ typescript: true, jsx: true }),
      'html': html(),
      'css': css(),
      'json': json(),
      'py': python(),
      'md': markdown(),
      'java': java(),
      'cpp': cpp(),
    };
    return ext && langMap[ext] ? langMap[ext] : javascript();
  };

  const setupEditorView = (fileId: string) => {
    if (!editorContainerRef.current || !fileId || !yfileMap || isViewLoading || !editorReady) {
      return;
    }

    try {
      setIsViewLoading(true);
      const yfile = yfileMap.get(fileId);
      if (!yfile || yfile.get("type") !== "file") {
        setIsViewLoading(false);
        return;
      }

      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }

      if (editorContainerRef.current) {
        editorContainerRef.current.innerHTML = '';
      }

      const ytext = yfile.get("content") as Y.Text;
      if (!ytext) {
        setIsViewLoading(false);
        return;
      }

      const filename = yfile.get("name");
      const language = getLanguageExtension(filename);

      if (yprovider?.awareness) {
        const currentState = yprovider.awareness.getLocalState() || {};
        yprovider.awareness.setLocalState({
          ...currentState,
          editing: fileId
        });
      }

      setTimeout(() => {
        try {
          const undoManager = new Y.UndoManager(ytext);
          const yCollabExtension = yCollab(ytext, yprovider?.awareness || null, { undoManager });

          const startState = EditorState.create({
            doc: ytext.toString(),
            extensions: [
              basicSetup,
              vscodeDark,
              language,
              yCollabExtension,
              EditorState.tabSize.of(2),
              EditorView.lineWrapping,
              EditorView.theme({
                "&": {
                  height: "100%",
                  fontSize: "14px",
                  fontFamily: '"Fira Code", "Consolas", "Courier New", monospace',
                },
                ".cm-gutters": {
                  fontSize: "12px",
                  backgroundColor: "#1e1e1e",
                  color: "#858585",
                  border: "none",
                  fontFamily: "monospace",
                }
              })
            ],
          });

          const view = new EditorView({
            state: startState,
            parent: editorContainerRef.current as HTMLElement
          });

          editorRef.current = view;
          viewsRef.current.set(fileId, view);
          activeFile.current = fileId;

          setIsViewLoading(false);
        } catch (error) {
          console.error('View creation failed:', error);
          setIsViewLoading(false);
        }
      }, 50);
    } catch (error) {
      console.error('Editor setup error:', error);
      setIsViewLoading(false);
    }
  };

  const handleAddItem = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newItemName.trim() && yfileMap && yrootItems) {
      e.preventDefault();
      
      const newId = uuidv4();
      const yitem = new Y.Map();
      
      yitem.set("id", newId);
      yitem.set("name", newItemName.trim());
      yitem.set("type", newItemType);
      yitem.set("parentId", parentId);
      
      if (newItemType === "file") {
        const ytext = new Y.Text();
        yitem.set("content", ytext);
      } else {
        yitem.set("children", new Y.Array());
        yitem.set("isOpen", true);
      }

      yfileMap.set(newId, yitem);
      
      if (parentId) {
        const parent = yfileMap.get(parentId);
        if (parent?.get("children")) {
          parent.get("children").push([newId]);
        }
      } else {
        yrootItems.push([newId]);
      }

      setNewItemName("");
      setIsAdding(false);
      setParentId(null);
      
      if (newItemType === "file") {
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.destroy();
            editorRef.current = null;
          }
          setTimeout(() => setActiveFileId(newId), 50);
        }, 50);
      }
    }

    if (e.key === "Escape") {
      setNewItemName("");
      setIsAdding(false);
      setParentId(null);
    }
  };

  const toggleFolder = (folderId: string) => {
    const yfolder = yfileMap?.get(folderId);
    if (yfolder) {
      yfolder.set("isOpen", !yfolder.get("isOpen"));
    }
  };

  const deleteItem = (itemId: string) => {
    if (activeFileId === itemId) {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
      
      const view = viewsRef.current.get(itemId);
      if (view) {
        view.destroy();
        viewsRef.current.delete(itemId);
      }
      
      setActiveFileId(null);
      activeFile.current = null;
    }
    
    const yitem = yfileMap?.get(itemId);
    if (!yitem) return;

    const parentId = yitem.get("parentId");
    
    if (parentId) {
      const parent = yfileMap?.get(parentId);
      if (parent?.get("children")) {
        const children = parent.get("children");
        const index = children.toArray().indexOf(itemId);
        if (index !== -1) {
          children.delete(index, 1);
        }
      }
    } else if (yrootItems) {
      const index = yrootItems.toArray().indexOf(itemId);
      if (index !== -1) {
        yrootItems.delete(index, 1);
      }
    }

    if (yitem.get("type") === "folder" && yitem.get("children")) {
      const childrenToDelete = [...yitem.get("children").toArray()];
      childrenToDelete.forEach((childId: string) => {
        deleteItem(childId);
      });
    }

    yfileMap?.delete(itemId);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    document.body.style.cursor = 'row-resize';
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
    e.preventDefault();
  };
  
  const handleDrag = (e: MouseEvent) => {
    if (!isDragging) return;
    const editorContainer = document.querySelector('.editor-container');
    if (editorContainer) {
      const containerRect = editorContainer.getBoundingClientRect();
      const newHeight = Math.max(100, Math.min(containerRect.height - e.clientY + containerRect.top, containerRect.height - 100));
      setTerminalHeight(newHeight);
      
      if (fitAddon.current) {
        setTimeout(() => fitAddon.current?.fit(), 0);
      }
    }
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
    
    if (fitAddon.current) {
      setTimeout(() => fitAddon.current?.fit(), 0);
    }
    
    if (editorRef.current) {
      editorRef.current.requestMeasure();
    }
  };

  const renderToolbar = () => (
    <div className="editor-toolbar bg-[#252526] p-2 border-b border-[#1C1C1C] flex items-center">
     
      <button 
      onClick={runActiveFile}
      className="px-3 py-1 bg-[#388A34] text-white rounded text-sm hover:bg-[#4CAF50] flex items-center gap-1"
      title="Run current file"
    >
      <Play className="w-4 h-4" /> Run
    </button>

    </div>
  );

  const renderFileTree = (items: FileMap, depth = 0) => {
    return Array.from(items.entries()).map(([id, item]) => {
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
        const editors = yprovider?.awareness ? 
          Array.from(yprovider.awareness.getStates().entries())
            .filter(([_, state]) => state?.editing === id)
            .map(([_, state]) => state?.user)
            .filter(Boolean) : [];

        const isBeingEditedByOthers = editors.length > 0;

        return (
          <div
            key={id}
            className={`flex items-center py-1 px-2 hover:bg-[#2A2D2E] rounded text-[#CCCCCC] cursor-pointer text-sm group ${
              activeFileId === id ? "bg-[#37373D]" : ""
            }`}
            style={{ paddingLeft }}
            onClick={() => {
              if (activeFileId !== id) {
                setActiveFileId(id);
              }
            }}
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

  useEffect(() => {
    setEditorReady(false);
    setIsViewLoading(false);
    
    if (editorRef.current) {
      editorRef.current.destroy();
      editorRef.current = null;
    }
    
    viewsRef.current.forEach((view) => {
      view.destroy();
    });
    viewsRef.current.clear();
    
    ydoc = new Y.Doc();
    reconnectYjs();
    
    setEditorReady(true);

    return () => {
      if (yfileMap) yfileMap.unobserveDeep(observer);
      if (yrootItems) yrootItems.unobserve(observer);
      
      if (yprovider?.awareness) {
        yprovider.awareness.off("change", handleAwarenessChange);
        yprovider.awareness.setLocalState(null);
        yprovider.destroy();
      }
      
      viewsRef.current.forEach((view) => {
        view.destroy();
      });
      viewsRef.current.clear();
      
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
      
      if (ydoc) {
        try {
          ydoc.destroy();
        } catch (e) {
          console.warn('Ydoc cleanup error:', e);
        }
        ydoc = null;
      }
    };
  }, [change]);

  useEffect(() => {
    if (activeFileId && editorReady && !isViewLoading) {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
      
      setTimeout(() => {
        setupEditorView(activeFileId);
      }, 50);
    }
  }, [activeFileId, editorReady]);

  useEffect(() => {
    if (terminalRef.current && !term.current) {
      term.current = new Terminal({
        cursorBlink: true,
        theme: {
          background: '#1E1E1E',
          foreground: '#CCCCCC',
          cursor: '#FFFFFF',
          selection: '#264F78',
        },
        fontFamily: '"Cascadia Code", Menlo, monospace',
        fontSize: 14,
        scrollback: 1000,
        convertEol: true,
        allowTransparency: true,
      });
  
      fitAddon.current = new FitAddon();
      term.current.loadAddon(fitAddon.current);
  
      term.current.open(terminalRef.current);
  
      setTimeout(() => {
        fitAddon.current?.fit();
      }, 100);
  
      term.current.writeln('$ '); // initial line
    }
  }, []);

  useEffect(() => {
    if (fitAddon.current) {
      setTimeout(() => fitAddon.current?.fit(), 0);
    }
    
    if (editorRef.current) {
      setTimeout(() => editorRef.current.requestMeasure(), 0);
    }
  }, [terminalHeight]);

  useEffect(() => {
    if (codeChange) {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }

      viewsRef.current.forEach((view) => {
        view.destroy();
      });
      viewsRef.current.clear();
      
      setTimeout(() => {
        performDocumentReset({
          ydoc, 
          yfileMap, 
          yrootItems, 
          yprovider, 
          modelsRef: { current: new Map() },
          setActiveFileId
        });  
        observer();
        setCodeChange(false);
      }, 50);
    }
  }, [codeChange, setCodeChange]);

  useEffect(() => {
    if (!isChatOpen && messages.length > 1) {
      setUnreadMessages(prev => prev + 1);
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("mouseup", handleDragEnd);
    } else {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, [isDragging]);

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
          
          {renderFileTree(files)}
        </div>
      </div>

      <div className="flex-1 flex flex-col editor-container">
        {renderToolbar()}
        
        <div style={{ height: `calc(100% - ${terminalHeight}px - 40px)`, overflow: 'hidden' }}>
          {activeFileId ? (
            <div 
              ref={editorContainerRef} 
              className="h-full w-full" 
              style={{ overflow: 'hidden' }}
            >
              {isViewLoading && <div className="p-4 text-[#BBBBBB]">Loading editor...</div>}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[#BBBBBB]">
              Select a file to start editing
            </div>
          )}
        </div>

        <div 
          className="cursor-row-resize bg-[#1E1E1E] border-t border-[#333333] flex items-center justify-center h-2"
          onMouseDown={handleDragStart}
        >
          <div className="w-8 h-1 bg-[#555555] rounded-full" />
        </div>

        <div className="bg-[#1E1E1E] h-full flex flex-col" style={{ height: terminalHeight - 8 }}>
          <div className="flex items-center px-3 py-1 border-b border-[#333333] bg-[#252526] text-[#BBBBBB]">
            <span className="text-xs font-medium">TERMINAL</span>

            <div className="ml-auto flex items-center">
              {!isChatOpen && (
                <button
                  onClick={() => {
                    setIsChatOpen(true);
                    setUnreadMessages(0);
                  }}
                  className="relative p-1 text-[#BBBBBB] hover:text-white hover:bg-[#2A2D2E] rounded-sm"
                  title="Open Chat"
                >
                  <ChatIcon />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#1C6B9C] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex">
            <div
              ref={terminalRef}
              className="flex-1 overflow-hidden"
              style={{ minHeight: "200px", backgroundColor: "#1E1E1E" }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="fixed top-0 right-0 h-full w-80 z-[300] bg-[#1e1e1ee6] backdrop-blur-lg shadow-2xl rounded-l-2xl overflow-hidden border-l border-white/10"
          >
            <ChatPanel
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              currentUser={token || "Anonymous"}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollaborativeEditor;