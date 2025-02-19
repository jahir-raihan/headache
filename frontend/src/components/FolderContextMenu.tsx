'use client';

import * as ContextMenu from '@radix-ui/react-context-menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faTrash, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Folder } from '@/types/folder';

interface FolderContextMenuProps {
  folder: Folder;
  onRename: (folder: Folder) => void;
  onMove: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
  children: React.ReactNode;
}

export default function FolderContextMenu({
  folder,
  onRename,
  onMove,
  onDelete,
  children,
}: FolderContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="min-w-[160px] bg-gray-800 rounded-md shadow-lg border border-gray-700 p-1">
          <ContextMenu.Item
            className="flex items-center px-2 py-1.5 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer rounded-sm"
            onClick={() => onRename(folder)}
          >
            <FontAwesomeIcon icon={faPencil} className="w-4 h-4 mr-2" />
            Rename
          </ContextMenu.Item>
          <ContextMenu.Item
            className="flex items-center px-2 py-1.5 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer rounded-sm"
            onClick={() => onMove(folder)}
          >
            <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 mr-2" />
            Move
          </ContextMenu.Item>
          <ContextMenu.Item
            className="flex items-center px-2 py-1.5 text-sm text-red-400 hover:bg-red-900/50 cursor-pointer rounded-sm"
            onClick={() => onDelete(folder)}
          >
            <FontAwesomeIcon icon={faTrash} className="w-4 h-4 mr-2" />
            Delete
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
