'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { FolderContents, SelectedItem } from '@/types/folder';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFile, faChevronLeft, faPlus } from '@fortawesome/free-solid-svg-icons';
import RenameDialog from './dialogs/RenameDialog';
import MoveDialog from './dialogs/MoveDialog';
import DeleteDialog from './dialogs/DeleteDialog';
import CreateFolderDialog from './dialogs/CreateFolderDialog';
import CreateFileDialog from './dialogs/CreateFileDialog';
import FolderContextMenu from './FolderContextMenu';
import FileContextMenu from './FileContextMenu';

interface FolderExplorerProps {
  currentFolder: number | null;
  onFolderChange: (folderId: number | null) => void;
}

export default function FolderExplorer({ currentFolder, onFolderChange }: FolderExplorerProps) {
  const [folderPath, setFolderPath] = useState<{ id: number | null; name: string }[]>([
    { id: null, name: 'Root' },
  ]);
  const [contents, setContents] = useState<FolderContents>({ folders: [], documents: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State for rename dialog
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  // State for move dialog
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<number | null>(null);

  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // State for create dialogs
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [createFileDialogOpen, setCreateFileDialogOpen] = useState(false);

  const fetchFolderContents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/folder-details/${currentFolder || ''}${
        searchQuery ? `?q=${searchQuery}` : ''
      }`);
      setContents(response.data);
    } catch (error) {
      console.error('Error fetching folder contents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentFolder, searchQuery]);

  useEffect(() => {
    fetchFolderContents();
  }, [fetchFolderContents]);

  const navigateToFolder = (folderId: number | null, folderName: string) => {
    onFolderChange(folderId);
    if (folderId === null) {
      setFolderPath([{ id: null, name: 'Root' }]);
    } else {
      const existingIndex = folderPath.findIndex(folder => folder.id === folderId);
      if (existingIndex !== -1) {
        // If clicking an existing folder in breadcrumb, truncate the path
        setFolderPath(folderPath.slice(0, existingIndex + 1));
      } else {
        // If clicking a new folder, append to path
        setFolderPath([...folderPath, { id: folderId, name: folderName }]);
      }
    }
  };

  const navigateBack = () => {
    if (folderPath.length > 1) {
      const newPath = folderPath.slice(0, -1);
      setFolderPath(newPath);
      onFolderChange(newPath[newPath.length - 1].id);
    }
  };

  const handleRename = async () => {
    if (!selectedItem || !newName) return;

    try {
      if (selectedItem.type === 'folder') {
        await api.patch(`/folder-update/${selectedItem.id}`, { name: newName });
      } else {
        await api.post(`/file-update/${selectedItem.id}`, { name: newName });
      }
      fetchFolderContents();
      setRenameDialogOpen(false);
    } catch (error) {
      console.error('Error renaming item:', error);
    }
  };

  const handleMove = async () => {
    if (!selectedItem || targetFolderId === undefined) return;

    try {
      if (selectedItem.type === 'folder') {
        await api.patch(`/folder-update/${selectedItem.id}`, { parent_id: targetFolderId });
      } else {
        await api.post(`/file-update/${selectedItem.id}`, { folder_id: targetFolderId });
      }
      fetchFolderContents();
      setMoveDialogOpen(false);
    } catch (error) {
      console.error('Error moving item:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      if (selectedItem.type === 'folder') {
        await api.delete(`/folder-delete/${selectedItem.id}`);
      } else {
        await api.delete(`/file-delete/${selectedItem.id}`);
      }
      fetchFolderContents();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;

    try {
      await api.post(`/folder-create${currentFolder ? `/${currentFolder}` : ''}`, {
        name: newFolderName,
      });
      fetchFolderContents();
      setCreateFolderDialogOpen(false);
      setNewFolderName('');
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleCreateFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file); // Add filename as third parameter
      
      await api.post(
        `/file-create${currentFolder ? `/${currentFolder}` : ''}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data', // Ensure this header is set
          },
        }
      );
      fetchFolderContents();
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Create Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCreateFolderDialogOpen(true)}
            className="px-3 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-md flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            <span>New Folder</span>
          </button>
          <button
            onClick={() => setCreateFileDialogOpen(true)}
            className="px-3 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-md flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            <span>Upload File</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1">
       
          <input
            type="text"
            placeholder="Search files and folders..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-300">
        {folderPath.length > 1 && (
          <button
            onClick={navigateBack}
            className="p-1 hover:bg-gray-800 rounded-full transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
          </button>
        )}
        {folderPath.map((folder, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            <button
              onClick={() => navigateToFolder(folder.id, folder.name)}
              className="hover:text-primary-500 transition-colors"
            >
              {folder.name}
            </button>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        /* Folder Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {contents.folders.map((folder) => (
            <FolderContextMenu
              key={folder.id}
              folder={folder}
              onRename={(folder) => {
                setSelectedItem({ type: 'folder', id: folder.id, name: folder.name, parentId: folder.parent_id });
                setNewName(folder.name);
                setRenameDialogOpen(true);
              }}
              onMove={(folder) => {
                setSelectedItem({ type: 'folder', id: folder.id, name: folder.name, parentId: folder.parent_id });
                setMoveDialogOpen(true);
              }}
              onDelete={(folder) => {
                setSelectedItem({ type: 'folder', id: folder.id, name: folder.name, parentId: folder.parent_id });
                setDeleteDialogOpen(true);
              }}
            >
              <button
                onClick={() => navigateToFolder(folder.id, folder.name)}
                className="p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-primary-500 hover:shadow-md transition-all group w-full text-left"
              >
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faFolder} className="w-6 h-6 text-gray-200 group-hover:text-gray-500" />
                  <span className="text-gray-200 group-hover:text-gray-100 truncate">
                    {folder.name}
                  </span>
                </div>
              </button>
            </FolderContextMenu>
          ))}
          
          {contents.documents.map((document) => (
            <FileContextMenu
              key={document.id}
              document={document}
              onRename={(document) => {
                setSelectedItem({ type: 'document', id: document.id, name: document.name, parentId: document.folder_id });
                setNewName(document.name);
                setRenameDialogOpen(true);
              }}
              onMove={(document) => {
                setSelectedItem({ type: 'document', id: document.id, name: document.name, parentId: document.folder_id });
                setMoveDialogOpen(true);
              }}
              onDelete={(document) => {
                setSelectedItem({ type: 'document', id: document.id, name: document.name, parentId: document.folder_id });
                setDeleteDialogOpen(true);
              }}
            >
              <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-primary-500 hover:shadow-md transition-all group">
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faFile} className="w-6 h-6 text-gray-200 group-hover:text-gray-500" />
                  <span className="text-gray-200 group-hover:text-gray-100 truncate">
                    {document.name}
                  </span>
                </div>
              </div>
            </FileContextMenu>
          ))}
        </div>
      )}

      {!isLoading && contents.folders.length === 0 && contents.documents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">This folder is empty</p>
        </div>
      )}

      {/* Dialogs */}
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        selectedItem={selectedItem}
        newName={newName}
        onNewNameChange={setNewName}
        onRename={handleRename}
      />
      <MoveDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        selectedItem={selectedItem}
        folders={contents.folders}
        targetFolderId={targetFolderId}
        onTargetFolderChange={setTargetFolderId}
        onMove={handleMove}
      />
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        selectedItem={selectedItem}
        onDelete={handleDelete}
      />

      {/* Create Dialogs */}
      <CreateFolderDialog
        open={createFolderDialogOpen}
        onOpenChange={setCreateFolderDialogOpen}
        folderName={newFolderName}
        onFolderNameChange={setNewFolderName}
        onCreateFolder={handleCreateFolder}
      />
      <CreateFileDialog
        open={createFileDialogOpen}
        onOpenChange={setCreateFileDialogOpen}
        onFileSelect={handleCreateFile}
      />
    </div>
  );
}
