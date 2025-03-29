import React, { useState } from 'react';
import { Modal } from './Modal';
import { GitPullRequest, Eye, Check, X } from 'lucide-react';

interface PullRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PullRequestModal({ isOpen, onClose }: PullRequestModalProps) {
  const [fileName, setFileName] = useState('');
  const [codespaceName, setCodespaceName] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleApprove = () => {
    console.log('Approving pull request');
    onClose();
  };

  const handleReject = () => {
    console.log('Rejecting pull request');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pull Request">
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <img
            className="w-10 h-10 rounded-full"
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=faces"
            alt="Requester"
          />
          <div>
            <h3 className="text-white font-medium">John Doe</h3>
            <p className="text-sm text-gray-400">Requested changes</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-gray-400">File Name</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter file name"
            className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Codespace Name</label>
          <input
            type="text"
            value={codespaceName}
            onChange={(e) => setCodespaceName(e.target.value)}
            placeholder="Enter codespace name"
            className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
          />
        </div>

        {showPreview ? (
          <div className="bg-[#1e1f22] rounded p-4 h-48 overflow-auto">
            <pre className="text-gray-300 text-sm">
              {/* <code>
                // Preview of changes will appear here
                // function example()
                //   console.log("Preview");
                //
              </code> */}
            </pre>
          </div>
        ) : (
          <button
            onClick={() => setShowPreview(true)}
            className="w-full bg-[#404249] text-white py-2 rounded hover:bg-[#4752c4] transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview Changes
          </button>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Approve
          </button>
          <button
            onClick={handleReject}
            className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>
    </Modal>
  );
}