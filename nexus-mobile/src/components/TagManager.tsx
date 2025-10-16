// Written by: Sarah Williams - Frontend Team Lead
// Reviewed by: Priya
// Status: Production-Ready

import { useState, useRef, useEffect } from 'react';
import './TagManager.css';

interface TagManagerProps {
  tags: string[];
  selectedTags?: string[];
  onTagsChange: (tags: string[]) => void;
  onFilterByTag?: (tag: string) => void;
  mode?: 'edit' | 'filter';
}

export default function TagManager({
  tags,
  selectedTags = [],
  onTagsChange,
  onFilterByTag,
  mode = 'edit'
}: TagManagerProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get all existing tags from conversations
  const allTags = Array.from(new Set(tags)).sort();

  // Filter suggestions based on input
  const suggestions = allTags.filter(
    (tag) =>
      tag.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedTags.includes(tag)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      onTagsChange([...selectedTags, trimmedTag]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag));
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setShowSuggestions(value.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  if (mode === 'filter') {
    return (
      <div className="tag-filter-container">
        <div className="tag-filter-header">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2a1 1 0 011-1h10a1 1 0 011 1v.5a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5V2z"/>
            <path d="M2.5 4a.5.5 0 00-.5.5v8a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-8a.5.5 0 00-.5-.5h-11zm1 .5h9v7h-9v-7z"/>
          </svg>
          <span>Filter by tag</span>
        </div>
        <div className="tag-filter-list">
          {allTags.length === 0 ? (
            <div className="tag-empty-state">No tags yet</div>
          ) : (
            allTags.map((tag) => (
              <button
                key={tag}
                className={`tag-filter-item ${
                  selectedTags.includes(tag) ? 'active' : ''
                }`}
                onClick={() => onFilterByTag && onFilterByTag(tag)}
              >
                <span>#{tag}</span>
                {selectedTags.includes(tag) && (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-3.97-3.03a.75.75 0 00-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 00-1.06 1.06L6.97 11.03a.75.75 0 001.079-.02l3.992-4.99a.75.75 0 00-.01-1.05z"/>
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="tag-manager" ref={containerRef}>
      <div className="tag-input-container">
        <div className="tag-list">
          {selectedTags.map((tag) => (
            <div key={tag} className="tag-chip">
              <span>#{tag}</span>
              <button
                className="tag-remove"
                onClick={() => removeTag(tag)}
                title="Remove tag"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
                </svg>
              </button>
            </div>
          ))}
          <input
            ref={inputRef}
            type="text"
            className="tag-input"
            placeholder={selectedTags.length === 0 ? 'Add tags...' : ''}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowSuggestions(true)}
          />
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="tag-suggestions">
          {suggestions.map((tag) => (
            <button
              key={tag}
              className="tag-suggestion-item"
              onClick={() => addTag(tag)}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2a1 1 0 011-1h10a1 1 0 011 1v.5a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5V2z"/>
                <path d="M2.5 4a.5.5 0 00-.5.5v8a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-8a.5.5 0 00-.5-.5h-11zm1 .5h9v7h-9v-7z"/>
              </svg>
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
