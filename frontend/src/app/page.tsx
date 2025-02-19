'use client';

import { useState } from 'react';
import FolderExplorer from '@/components/FolderExplorer';
import { FolderUpload } from '@/components/FolderUpload';
import { cn } from '@/lib/utils';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'upload'>('explorer');
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['explorer', 'upload'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as 'explorer' | 'upload')}
                  className={cn(
                    'py-4 px-1 border-b-2 font-medium text-sm capitalize',
                    activeTab === tab
                      ? 'border-primary-500 text-gray-200'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  )}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'explorer' ? (
              <FolderExplorer currentFolder={currentFolder} onFolderChange={setCurrentFolder} />
            ) : (
              <FolderUpload currentFolder={currentFolder} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
