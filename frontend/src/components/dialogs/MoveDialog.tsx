'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { SelectedItem, Folder } from '@/types/folder';

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: SelectedItem | null;
  folders: Folder[];
  targetFolderId: number | null;
  onTargetFolderChange: (folderId: number | null) => void;
  onMove: () => void;
}

export default function MoveDialog({
  open,
  onOpenChange,
  selectedItem,
  folders,
  targetFolderId,
  onTargetFolderChange,
  onMove,
}: MoveDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[400px] space-y-4">
          <Dialog.Title className="text-lg font-medium">Move {selectedItem?.type}</Dialog.Title>
          <div>
            <label htmlFor="folder" className="block text-sm font-medium text-gray-700 mb-1">
              Select destination folder
            </label>
            <select
              id="folder"
              value={targetFolderId === null ? '' : targetFolderId}
              onChange={(e) => onTargetFolderChange(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Root</option>
              {folders
                .filter((folder) => folder.id !== selectedItem?.id) // Can't move to itself
                .map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={onMove}
              className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-md"
            >
              Move
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
