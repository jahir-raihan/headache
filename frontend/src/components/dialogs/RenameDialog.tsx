'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { SelectedItem } from '@/types/folder';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: SelectedItem | null;
  newName: string;
  onNewNameChange: (name: string) => void;
  onRename: () => void;
}

export default function RenameDialog({
  open,
  onOpenChange,
  selectedItem,
  newName,
  onNewNameChange,
  onRename,
}: RenameDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg p-6 w-[400px] space-y-4 shadow-xl border border-gray-700">
          <Dialog.Title className="text-lg font-medium text-gray-100">Rename {selectedItem?.type}</Dialog.Title>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              New name
            </label>
            <input
              type="text"
              id="name"
              value={newName}
              onChange={(e) => onNewNameChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={onRename}
              className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-md"
            >
              Rename
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
