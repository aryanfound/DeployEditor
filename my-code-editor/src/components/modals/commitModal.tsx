import React, { useState } from "react";
import { ydoc } from "../Editor";
import { X } from "lucide-react";
import { exportYjsStructure } from "../functions/yjsExport";
import { CodeSpaceInfo } from "../../../globaltool";

interface CommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommit: (message: string, description?: string) => void;
}

export function CommitModal({ isOpen, onClose, onCommit }: CommitModalProps) {
  const [commitMessage, setCommitMessage] = useState("");
  const [commitDescription, setCommitDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;

    setIsLoading(true);
    try {
      const exportdata = await exportYjsStructure(commitMessage, commitDescription);

      if (!exportdata) {
        throw new Error("Failed to export data.");
      }

      CodeSpaceInfo.folder_bufferdata.data = exportdata;

      onCommit(commitMessage, commitDescription);
      onClose();
      console.log("Committed successfully");
    } catch (error) {
      console.error("Failed to commit:", error);
    } finally {
      setIsLoading(false); // Ensure loading state is reset
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#2b2d31] rounded-md shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-[#1e1f22]">
          <h2 className="text-white text-lg font-medium">Commit changes</h2>
          <button
            onClick={()=>{onClose
                console.log("close")
                    
                }   
            }
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="commit-message" className="block text-sm font-medium text-gray-300 mb-1">
              Commit message
            </label>
            <input
              id="commit-message"
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Update component styling"
              className="w-full bg-[#383a40] border border-[#1e1f22] rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="commit-description" className="block text-sm font-medium text-gray-300 mb-1">
              Extended description (optional)
            </label>
            <textarea
              id="commit-description"
              value={commitDescription}
              onChange={(e) => setCommitDescription(e.target.value)}
              placeholder="Add more details about your changes..."
              className="w-full bg-[#383a40] border border-[#1e1f22] rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5865f2] min-h-32"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#383a40] text-white rounded hover:bg-[#404249]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !commitMessage.trim()}
              className={`px-4 py-2 bg-[#5865f2] text-white rounded flex items-center gap-2 ${
                isLoading || !commitMessage.trim() ? "opacity-70 cursor-not-allowed" : "hover:bg-[#4752c4]"
              }`}
            >
              {isLoading ? "Committing..." : "Commit changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}