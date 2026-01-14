import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

const TagInput = ({ label, tags, onChange, placeholder = "Type and press Enter", helperText, defaultTags = [], maxLength = 300, options }) => {
    const [inputValue, setInputValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !inputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setHighlightedIndex(0);
    }, [inputValue]);

    const handleKeyDown = (e) => {
        if (options && showSuggestions && filteredOptions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                // Scroll into view logic could go here or in a useEffect
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredOptions[highlightedIndex]) {
                    addTag(filteredOptions[highlightedIndex]);
                }
            } else if (e.key === 'Tab') {
                // Optional: Tab to select
                if (filteredOptions[highlightedIndex]) {
                    e.preventDefault();
                    addTag(filteredOptions[highlightedIndex]);
                }
            }
        }

        if (e.key === 'Enter' && (!options || !showSuggestions || filteredOptions.length === 0)) {
            e.preventDefault();
            addTag(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    // Auto-scroll effect
    useEffect(() => {
        if (showSuggestions && dropdownRef.current) {
            const activeItem = dropdownRef.current.children[highlightedIndex];
            if (activeItem) {
                activeItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, showSuggestions]);

    const addTag = (valToAdd) => {
        const val = typeof valToAdd === 'string' ? valToAdd.trim() : inputValue.trim();

        if (!val) return;

        if (options) {
            const match = options.find(opt => opt.toLowerCase() === val.toLowerCase());
            if (!match) return;

            if (!tags.includes(match)) {
                onChange([...tags, match]);
            }
            setInputValue("");
            setShowSuggestions(false);
            setHighlightedIndex(0);
        } else {
            if (val && !tags.includes(val)) {
                onChange([...tags, val]);
                setInputValue("");
            }
        }
    };

    const removeTag = (tagToRemove) => {
        onChange(tags.filter(tag => tag !== tagToRemove));
    };

    const toggleDefaultTag = (tag) => {
        if (tags.includes(tag)) {
            removeTag(tag);
        } else {
            onChange([...tags, tag]);
        }
    };

    const handleContainerClick = () => {
        inputRef.current?.focus();
    };

    const currentLength = inputValue.length;

    const filteredOptions = options
        ? options.filter(opt =>
            opt.toLowerCase().includes(inputValue.toLowerCase()) &&
            !tags.includes(opt)
        ).slice(0, 50)
        : [];

    return (
        <div className="mb-6 space-y-1.5 relative">
            <label className="block text-base font-medium text-gray-900">{label}</label>

            <div
                className={`w-full px-2 py-2 border rounded-lg bg-white flex flex-wrap gap-2 transition-colors cursor-text relative ${isFocused ? 'border-green-500 ring-2 ring-green-500/20' : 'border-gray-200'
                    }`}
                onClick={handleContainerClick}
            >
                {tags.map((tag, index) => (
                    <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-50 border border-gray-200 text-gray-700"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(tag);
                            }}
                            className="ml-1.5 hover:text-red-500 focus:outline-none text-gray-400"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        if (options) setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        setIsFocused(true);
                        if (options) setShowSuggestions(true);
                    }}
                    onBlur={() => {
                        // Auto-add tag on blur
                        if (inputValue && (!options || !showSuggestions || filteredOptions.length === 0)) {
                            addTag(inputValue);
                        }

                        // Delay hiding so clicks work
                        setTimeout(() => setIsFocused(false), 200);
                    }}
                    placeholder={tags.length === 0 ? placeholder : ""}
                    className="flex-grow min-w-[120px] outline-none text-base text-gray-700 bg-transparent py-1 px-1"
                    maxLength={maxLength}
                />
            </div>

            {/* Dropdown for options */}
            {options && showSuggestions && inputValue && (
                <div
                    ref={dropdownRef}
                    className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => addTag(opt)}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${idx === highlightedIndex
                                    ? 'bg-green-50 text-green-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">No matching skills found</div>
                    )}
                </div>
            )}

            <div className="flex justify-between items-start mt-1">
                {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
                <p className="text-xs text-gray-500 text-right">{currentLength}/{maxLength} characters</p>
            </div>

            {defaultTags && defaultTags.length > 0 && !options && (
                <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                        {defaultTags.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleDefaultTag(tag)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${tags.includes(tag)
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TagInput;
