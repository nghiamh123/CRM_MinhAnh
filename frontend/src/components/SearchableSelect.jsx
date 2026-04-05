import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Info } from 'lucide-react';
import '../styles/SearchableSelect.css';

const SearchableSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Chọn một mục...', 
  searchPlaceholder = 'Tìm kiếm...',
  renderOption,
  categories = [],
  selectedCategory,
  onCategoryChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.id === value);

  const filteredOptions = options.filter(opt => {
    const matchesSearch = opt.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         opt.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || opt.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (option) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="searchable-select-container" ref={dropdownRef}>
      <div 
        className={`searchable-select-trigger ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={!selectedOption ? 'placeholder' : ''} style={{ flex: '1' }}>
          {selectedOption ? (renderOption ? renderOption(selectedOption) : selectedOption.name) : placeholder}
        </span>
        <ChevronDown size={18} className={`chevron ${isOpen ? 'open' : ''}`} />
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              ref={inputRef}
              type="text" 
              placeholder={searchPlaceholder} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <X 
                size={16} 
                className="clear-icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm('');
                }} 
              />
            )}
          </div>

          {categories && categories.length > 0 && (
            <div className="categories-tabs" style={{ display: 'flex', gap: '6px', padding: '8px 12px', background: '#f8fafc', overflowX: 'auto', borderBottom: '1px solid #f1f5f9' }}>
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCategoryChange) onCategoryChange(cat.value);
                  }}
                  style={{
                    padding: '4px 12px',
                    fontSize: '0.75rem',
                    borderRadius: '999px',
                    whiteSpace: 'nowrap',
                    border: cat.value === selectedCategory ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: cat.value === selectedCategory ? 'var(--primary)' : 'white',
                    color: cat.value === selectedCategory ? 'white' : 'var(--text-light)',
                    cursor: 'pointer'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          <div className="results-info">
            {searchTerm ? `${filteredOptions.length} Results` : 'All Results'}
          </div>

          <div className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div 
                  key={option.id} 
                  className={`select-option ${value === option.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(option)}
                >
                  <div className="option-content">
                    {renderOption ? renderOption(option) : (
                      <>
                        <span className="option-name">{option.name}</span>
                        {option.phone && <span className="option-subtext">{option.phone}</span>}
                      </>
                    )}
                  </div>
                  {value === option.id && <Check size={16} className="check-icon" />}
                </div>
              ))
            ) : (
              <div className="no-results-container">
                <div className="no-results-icon-box">
                  <Search size={24} />
                </div>
                <div className="no-results-title">No results</div>
                <div className="no-results-text">
                  We couldn't find any items with that name.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
