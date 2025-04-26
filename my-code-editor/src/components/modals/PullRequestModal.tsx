import React, { useState } from 'react';
import { Modal } from './Modal';
import { GitPullRequest, Check, X } from 'lucide-react';
import axios from 'axios';

interface PullRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PullRequestModal({ isOpen, onClose }: PullRequestModalProps) {
  const [codespaceId, setCodespaceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const handleApprove = async () => {
    if (!codespaceId) {
      setError('Codespace ID is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(
        'http://localhost:5001/space/pullSpace',
        { codespaceId },
        { headers }
      );
      console.log('Pull request approved:', response.data);
      onClose();
    } catch (err) {
      console.error('Error approving pull request:', err);
      setError('Failed to approve pull request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = () => {
    console.log(`Rejecting pull request for codespace: ${codespaceId}`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pull Request">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500 rounded-full">
            <GitPullRequest className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium">Pull Request</h3>
            <p className="text-sm text-gray-400">Review changes</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Codespace ID</label>
          <input
            type="text"
            value={codespaceId}
            onChange={(e) => {
              setCodespaceId(e.target.value);
              setError('');
            }}
            placeholder="Enter codespace ID"
            className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleReject}
            disabled={isLoading}
            className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={!codespaceId || isLoading}
            className={`flex-1 py-2 rounded transition-colors flex items-center justify-center gap-2 ${
              codespaceId && !isLoading
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              'Processing...'
            ) : (
              <>
                <Check className="w-4 h-4" />
                Approve
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}