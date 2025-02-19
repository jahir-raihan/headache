'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { ChangeEvent, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';

interface CreateFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (file: File) => void;
}

export default function CreateFileDialog({
  open,
  onOpenChange,
  onFileSelect,
}: CreateFileDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg p-6 w-[400px] space-y-4 shadow-xl border border-gray-700">
          <Dialog.Title className="text-lg font-medium text-gray-100">Upload File</Dialog.Title>
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-gray-700 rounded-lg hover:border-primary-500 transition-colors flex flex-col items-center justify-center space-y-2 bg-gray-800"
            >
              <FontAwesomeIcon icon={faUpload} className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-400">Click to select a file</span>
            </button>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
