import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

const TagInput = ({ label, tags, onChange, placeholder = "Type and press Enter", helperText, defaultTags = [] }) => {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    const addTag = () => {
        const val = inputValue.trim();
        if (val && !tags.includes(val)) {
            onChange([...tags, val]);
            setInputValue("");
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

    return (
        <div className="mb-6 space-y-1.5">
            <label className="block text-base font-medium text-gray-900">{label}</label>

            <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag, index) => (
                    <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1.5 hover:text-green-900 focus:outline-none"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>

            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-base text-gray-700"
                />
                <button
                    type="button"
                    onClick={addTag}
                    disabled={!inputValue.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-green-600 disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}

            {defaultTags && defaultTags.length > 0 && (
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
