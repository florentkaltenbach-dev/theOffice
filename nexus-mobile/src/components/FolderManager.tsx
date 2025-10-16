// Written by: Sarah Williams - Frontend Team Lead
// Reviewed by: Priya, Lin
// Status: Production-Ready

import { useState } from 'react';
import type { Folder } from '../types';
import './FolderManager.css';

interface FolderManagerProps {
  folders: Folder[];
  selectedFolderId?: string;
  onSelectFolder: (folderId: string | undefined) => void;
  onCreateFolder: (name: string, parentId?: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

export default function FolderManager({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder
}: FolderManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [contextMenuFolder, setContextMenuFolder] = useState<string | null>(null);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  const handleRenameFolder = (folderId: string) => {
    if (editingName.trim()) {
      onRenameFolder(folderId, editingName.trim());
      setEditingFolderId(null);
      setEditingName('');
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    if (window.confirm('Delete this folder? Conversations will not be deleted.')) {
      onDeleteFolder(folderId);
      setContextMenuFolder(null);
    }
  };

  const startEdit = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditingName(folder.name);
    setContextMenuFolder(null);
  };

  return (
    <div className="folder-manager">
      <div className="folder-header">
        <div
          className={`folder-item ${!selectedFolderId ? 'active' : ''}`}
          onClick={() => onSelectFolder(undefined)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M.5 3l.04.87a1.99 1.99 0 00-.342 1.311l.637 7A2 2 0 002.826 14H9.81a2 2 0 001.99-1.819l.637-7a1.99 1.99 0 00-.342-1.311L12.14 3H2.86zM8.5 11a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
            <path d="M6 2.341V2a1 1 0 112 0v.341h.938L9.5 3H6.562L7.124 2.341z"/>
          </svg>
          <span>All Conversations</span>
        </div>

        <button
          className="create-folder-button"
          onClick={() => setIsCreating(!isCreating)}
          title="Create new folder"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5A.5.5 0 018 2z"/>
          </svg>
        </button>
      </div>

      {isCreating && (
        <div className="folder-create-form">
          <input
            type="text"
            className="folder-input"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewFolderName('');
              }
            }}
            autoFocus
          />
          <div className="folder-form-actions">
            <button className="btn-save" onClick={handleCreateFolder}>
              Create
            </button>
            <button
              className="btn-cancel"
              onClick={() => {
                setIsCreating(false);
                setNewFolderName('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="folder-list">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`folder-item ${selectedFolderId === folder.id ? 'active' : ''}`}
          >
            {editingFolderId === folder.id ? (
              <div className="folder-edit-form">
                <input
                  type="text"
                  className="folder-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameFolder(folder.id);
                    if (e.key === 'Escape') setEditingFolderId(null);
                  }}
                  autoFocus
                />
                <div className="folder-form-actions">
                  <button
                    className="btn-save-small"
                    onClick={() => handleRenameFolder(folder.id)}
                  >
                    Save
                  </button>
                  <button
                    className="btn-cancel-small"
                    onClick={() => setEditingFolderId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="folder-content"
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M.54 3.87L.5 3a2 2 0 012-2h3.672a2 2 0 011.414.586l.828.828A2 2 0 009.828 3h3.982a2 2 0 011.992 2.181l-.637 7A2 2 0 0113.174 14H2.826a2 2 0 01-1.991-1.819l-.637-7a1.99 1.99 0 01.342-1.31z"/>
                  </svg>
                  <span>{folder.name}</span>
                </div>
                <button
                  className="folder-menu-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenuFolder(
                      contextMenuFolder === folder.id ? null : folder.id
                    );
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M3 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
                  </svg>
                </button>
                {contextMenuFolder === folder.id && (
                  <div className="folder-context-menu">
                    <button onClick={() => startEdit(folder)}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10z"/>
                      </svg>
                      Rename
                    </button>
                    <button
                      className="delete-option"
                      onClick={() => handleDeleteFolder(folder.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                        <path d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1z"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
