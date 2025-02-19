'use client';

import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/axios';

export function FolderUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const items = e.dataTransfer.items;
    if (items) {
      setIsUploading(true);
      try {
        const files: File[] = [];
        const paths: string[] = [];
        
        // Process all files
        for (let i = 0; i < items.length; i++) {
          const item = items[i].webkitGetAsEntry();
          if (item?.isFile) {
            const file = e.dataTransfer.files[i];
            files.push(file);
            paths.push(file.name);
          }
        }

        if (files.length > 0) {
          const formData = new FormData();
          files.forEach((file) => {
            formData.append('files', file);
          });
          paths.forEach((path) => {
            formData.append('paths', path);
          });

          await api.post('/folder-upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }
      } catch (error) {
        console.error('Error uploading folder:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSelectFolder = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        const paths: string[] = [];

        Array.from(files).forEach((file) => {
          formData.append('files', file);
          paths.push(file.name);
        });

        paths.forEach((path) => {
          formData.append('paths', path);
        });

        await api.post('/folder-upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } catch (error) {
        console.error('Error uploading folder:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <div
          className={`
            border-2 border-dashed rounded-lg p-12
            flex flex-col items-center justify-center
            transition-colors duration-200 relative
            ${isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-500'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="text-primary-600 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-2"></div>
                <p>Uploading...</p>
              </div>
            </div>
          )}
          
          <FontAwesomeIcon icon={faCloudArrowUp} className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload your folder
          </h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            Drag and drop your folder here, or click to select folder
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            
            multiple
          />
          <button
            type="button"
            onClick={handleSelectFolder}
            disabled={isUploading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select Folder
          </button>
        </div>

        <div className="mt-8">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions</h4>
          <ul className="text-sm text-gray-500 list-disc pl-5 space-y-2">
            <li>Drag and drop a folder or click to select</li>
            <li>All files within the folder will be uploaded</li>
            <li>The folder structure will be preserved</li>
            <li>Supported file types: All file types are supported</li>
          </ul>
        </div>
      </div>
    </>
  );
}
