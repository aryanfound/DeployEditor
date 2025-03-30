import React, { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import "xterm/css/xterm.css";
import { Play, Minimize2, Maximize2, X } from "lucide-react";

interface TerminalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function Terminal({ isVisible, onClose }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [width, setWidth] = useState(500);
  const [inputCode, setInputCode] = useState("");

  useEffect(() => {
    if (!terminalRef.current || !isVisible) return;

    // Initialize the terminal
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: "#1e1e1e",
        foreground: "#ffffff",
      },
    });

    // Addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    // Welcome message
    term.writeln("Welcome to the terminal! Type your code and press Run.");
    term.prompt = () => {
      term.write("\r\n$ ");
    };
    term.prompt();

    // Handle user input
    term.onKey(({ key, domEvent }) => {
      if (domEvent.key === "Enter") {
        term.prompt();
      } else if (domEvent.key === "Backspace") {
        if (term.buffer.active.cursorX > 2) {
          term.write("\b \b");
          setInputCode((prev) => prev.slice(0, -1));
        }
      } else {
        term.write(key);
        setInputCode((prev) => prev + key);
      }
    });

    // Store references
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Cleanup on unmount
    return () => {
      term.dispose();
    };
  }, [isVisible]);

  const runCode = async () => {
    if (!xtermRef.current) return;
    xtermRef.current.writeln("\nRunning code...");

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inputCode }),
      });

      const data = await response.json();
      xtermRef.current.writeln(data.output || "No output");
    } catch (error) {
      xtermRef.current.writeln("Error executing code");
      console.error("Error running code:", error);
    }
  };

  return isVisible ? (
    <div
      className={`fixed top-0 right-0 h-full bg-[#1e1e1e] border-l border-gray-700 transition-all ${
        isMaximized ? "w-full" : ""
      }`}
      style={{ width: isMaximized ? "100%" : `${width}px` }}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700">
        <button
          onClick={runCode}
          className="p-1 text-white bg-green-600 hover:bg-green-500 rounded"
        >
          <Play size={16} />
        </button>
        <div className="text-sm text-gray-300">Terminal</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 text-gray-400 hover:text-white hover:bg-[#404249] rounded"
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-[#404249] rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div ref={terminalRef} className="h-[calc(100%-37px)] overflow-hidden" />
    </div>
  ) : null;
}