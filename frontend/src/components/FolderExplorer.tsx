'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { FolderContents } from '@/types/folder';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFile, faChevronLeft, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

export default function FolderExplorer() {
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: number | null; name: string }[]>([
    { id: null, name: 'Root' },
  ]);
  const [contents, setContents] = useState<FolderContents>({ folders: [], documents: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFolderContents();
  }, [currentFolder, searchQuery]);

  const fetchFolderContents = async () => {
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
  };

  const navigateToFolder = (folderId: number | null, folderName: string) => {
    setCurrentFolder(folderId);
    if (folderId === null) {
      setFolderPath([{ id: null, name: 'Root' }]);
    } else {
      setFolderPath([...folderPath, { id: folderId, name: folderName }]);
    }
  };

  const navigateBack = () => {
    if (folderPath.length > 1) {
      const newPath = folderPath.slice(0, -1);
      setFolderPath(newPath);
      setCurrentFolder(newPath[newPath.length - 1].id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
       
        <input
          type="text"
          placeholder="Search files and folders..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        {folderPath.length > 1 && (
          <button
            onClick={navigateBack}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
          </button>
        )}
        {folderPath.map((folder, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            <button
              onClick={() => navigateToFolder(folder.id, folder.name)}
              className="hover:text-primary-600 transition-colors"
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
            <button
              key={folder.id}
              onClick={() => navigateToFolder(folder.id, folder.name)}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faFolder} className="w-6 h-6 text-primary-500 group-hover:text-primary-600" />
                <span className="text-gray-700 group-hover:text-gray-900 truncate">
                  {folder.name}
                </span>
              </div>
            </button>
          ))}
          
          {contents.documents.map((document) => (
            <div
              key={document.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faFile} className="w-6 h-6 text-gray-400 group-hover:text-gray-500" />
                <span className="text-gray-700 group-hover:text-gray-900 truncate">
                  {document.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && contents.folders.length === 0 && contents.documents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">This folder is empty</p>
        </div>
      )}
    </div>
  );
}
