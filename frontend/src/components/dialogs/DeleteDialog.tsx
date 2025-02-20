'use client';

import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { SelectedItem } from '@/types/folder';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: SelectedItem | null;
  onDelete: () => void;
}

export default function DeleteDialog({
  open,
  onOpenChange,
  selectedItem,
  onDelete,
}: DeleteDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/30" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[400px] space-y-4">
          <AlertDialog.Title className="text-lg font-medium text-red-600">
            Delete {selectedItem?.type}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-gray-500">
            Are you sure you want to delete &quot;{selectedItem?.name}&quot;? This action cannot be undone.
          </AlertDialog.Description>
          <div className="flex justify-end space-x-2">
            <AlertDialog.Cancel asChild>
              <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                Cancel
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onDelete}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Delete
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
