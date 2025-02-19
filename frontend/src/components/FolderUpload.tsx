'use client';

import { useState, useRef, InputHTMLAttributes, HTMLAttributes } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/axios';

// Extend InputHTMLAttributes to include webkitdirectory
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}

interface UploadProgress {
  stage: string;
  message: string;
  created_count?: number;
  valid_files_count?: number;
  total_files?: number;
  total_folders?: number;
  error?: string;
}

interface FolderUploadProps {
  currentFolder: number | null;
}

export function FolderUpload({ currentFolder }: FolderUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processUpload = async (formData: FormData) => {
    setIsUploading(true);
    setUploadProgress(null);
    
    try {
      abortControllerRef.current = new AbortController();
      // Ensure we're using the correct URL with folder_id
      const uploadUrl = `/folder-upload${currentFolder ? `/${currentFolder}` : ''}`;
      console.log('Uploading to:', uploadUrl);
      
      const response = await api.post(
        uploadUrl,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          signal: abortControllerRef.current.signal,
          responseType: 'text',
          onDownloadProgress: (progressEvent) => {
            const data = progressEvent.event.target.response;
            const lines = data.split('\n').filter(Boolean);
            if (lines.length > 0) {
              const lastLine = lines[lines.length - 1];
              try {
                const progress = JSON.parse(lastLine) as UploadProgress;
                setUploadProgress(progress);
              } catch (e) {
                console.error('Error parsing progress:', e);
              }
            }
          },
        }
      );

      // Handle final response
      const lines = response.data.split('\n').filter(Boolean);
      const lastLine = lines[lines.length - 1];
      const finalProgress = JSON.parse(lastLine) as UploadProgress;
      setUploadProgress(finalProgress);
    } catch (error) {
      console.error('Error uploading folder:', error);
      setUploadProgress({
        stage: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const items = e.dataTransfer.items;
    if (items) {
      const files: File[] = [];
      const paths: string[] = [];
      
      // Process all files recursively
      const processEntry = async (entry: FileSystemEntry, path: string = '') => {
        if (entry.isFile) {
          const file = await new Promise<File>((resolve) => {
            (entry as FileSystemFileEntry).file(resolve);
          });
          files.push(file);
          paths.push(path + entry.name);
        } else if (entry.isDirectory) {
          const dirReader = (entry as FileSystemDirectoryEntry).createReader();
          const entries = await new Promise<FileSystemEntry[]>((resolve) => {
            dirReader.readEntries(resolve);
          });
          for (const childEntry of entries) {
            await processEntry(childEntry, path + entry.name + '/');
          }
        }
      };

      try {
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry();
          if (entry) {
            await processEntry(entry);
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

          await processUpload(formData);
        }
      } catch (error) {
        console.error('Error processing files:', error);
        setUploadProgress({
          stage: 'error',
          message: error instanceof Error ? error.message : 'Error processing files',
        });
      }
    }
  };

  const handleSelectFolder = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const formData = new FormData();
      const paths: string[] = [];

      Array.from(files).forEach((file) => {
        formData.append('files', file);
        // Use webkitRelativePath for folder structure
        const path = file.webkitRelativePath || file.name;
        paths.push(path);

        console.log("paths", paths)
        console.log("files", files)
      });

      paths.forEach((path) => {
        formData.append('paths', path);
      });

      await processUpload(formData);
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
            <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
              <div className="text-gray-200 text-center max-w-md">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4 mx-auto"></div>
                {uploadProgress ? (
                  <div className="space-y-2">
                    <p className="font-medium">{uploadProgress.stage.replace(/_/g, ' ').toLowerCase()}</p>
                    <p className="text-sm text-gray-400">{uploadProgress.message}</p>
                    {uploadProgress.created_count !== undefined && uploadProgress.valid_files_count !== undefined && (
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${(uploadProgress.created_count / uploadProgress.valid_files_count) * 100}%`,
                          }}
                        ></div>
                      </div>
                    )}
                    {uploadProgress.stage === 'COMPLETE' && (
                      <p className="text-sm text-gray-400">
                        Uploaded {uploadProgress.total_files} files in {uploadProgress.total_folders} folders
                      </p>
                    )}
                    {uploadProgress.error && (
                      <p className="text-sm text-red-600">{uploadProgress.error}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400">Preparing upload...</p>
                )}
              </div>
            </div>
          )}
          
          <FontAwesomeIcon icon={faCloudArrowUp} className="w-16 h-16 text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-100 mb-2">
            Upload your folder
          </h3>
          <p className="text-sm text-gray-400 text-center mb-4">
            Drag and drop your folder here, or click to select folder
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            id="files"
            webkitdirectory="true"
            directory=""
            multiple
          />
          <button
            type="button"
            onClick={handleSelectFolder}
            disabled={isUploading}
            className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select Folder
          </button>
        </div>

        <div className="mt-8">
          <h4 className="text-sm font-medium text-gray-100 mb-2">Instructions</h4>
          <ul className="text-sm text-gray-400 list-disc pl-5 space-y-2">
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
