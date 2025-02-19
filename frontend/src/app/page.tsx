'use client';

import { useState } from 'react';
import FolderExplorer from '@/components/FolderExplorer';
import { FolderUpload } from '@/components/FolderUpload';
import { cn } from '@/lib/utils';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'upload'>('explorer');

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['explorer', 'upload'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as 'explorer' | 'upload')}
                  className={cn(
                    'py-4 px-1 border-b-2 font-medium text-sm capitalize',
                    activeTab === tab
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'explorer' ? (
              <FolderExplorer />
            ) : (
              <FolderUpload />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
