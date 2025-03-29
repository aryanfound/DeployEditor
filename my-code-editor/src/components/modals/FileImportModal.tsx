import React from 'react';
import { Modal } from './Modal';
import { Upload } from 'lucide-react';

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FileImportModal({ isOpen, onClose }: FileImportModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Files">
      <div className="space-y-4">
        <div
          className="border-2 border-dashed border-[#404249] rounded-lg p-8 text-center hover:bg-[#404249] transition-colors cursor-pointer"
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">
            Drag and drop files here or click to browse
          </p>
        </div>
        <button className="w-full bg-[#5865f2] text-white py-2 rounded hover:bg-[#4752c4] transition-colors">
          Import Files
        </button>
      </div>
    </Modal>
  );
}