import React, { useState, useRef, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import TagInput from '@/components/ui/TagInput';

const PostServiceSkills = (props) => {
    const {
        skills, setSkills,
        expertise, setExpertise,
        languages, setLanguages,
        defaultLanguages,
        allWorldLanguages,
        onBack, onNext,
        defaultSkills, defaultExpertise
    } = props;

    const [languageInput, setLanguageInput] = useState("");
    const [showLangSuggestions, setShowLangSuggestions] = useState(false);
    const langDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
                setShowLangSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleLanguage = (lang) => {
        if (languages.includes(lang)) {
            setLanguages(languages.filter(l => l !== lang));
        } else {
            if (languages.length >= 10) {
                alert("Maximum 10 languages can be selected");
                return;
            }
            setLanguages([...languages, lang]);
        }
    };

    const handleAddLanguage = (langToAdd) => {
        if (languages.length >= 10) {
            alert("Maximum 10 languages can be selected");
            return;
        }
        const exists = languages.some(l => l.toLowerCase() === langToAdd.toLowerCase());
        if (exists) {
            setLanguageInput("");
            setShowLangSuggestions(false);
            return;
        }
        setLanguages([...languages, langToAdd]);
        setLanguageInput("");
        setShowLangSuggestions(false);
    };

    const filteredLanguages = allWorldLanguages.filter(lang =>
        lang.toLowerCase().includes(languageInput.toLowerCase()) &&
        !languages.some(selected => selected.toLowerCase() === lang.toLowerCase())
    ).sort((a, b) => {
        const input = languageInput.toLowerCase();
        if (a.toLowerCase().startsWith(input)) return -1;
        return 1;
    });

    return (
        <div>
            <TagInput
                label="Skills"
                tags={skills}
                onChange={setSkills}
                defaultTags={defaultSkills}
                helperText="Type and press Enter to add your skill"
            />

            <TagInput
                label="Expertise"
                tags={expertise}
                onChange={setExpertise}
                defaultTags={defaultExpertise}
                helperText="Type and press Enter to add your expertise"
            />

            <div className="mb-6 space-y-1.5">
                <div className="flex justify-between items-center">
                    <label className="block text-base font-medium text-gray-900">
                        Languages <span className="text-red-500">*</span>
                    </label>
                    <span className="text-sm text-gray-500 font-normal">
                        Click a language to select it, or type another language and press Enter
                    </span>
                </div>

                <div className="w-full px-4 py-4 border border-gray-200 rounded-lg bg-white">
                    <div className="flex flex-wrap gap-2.5">
                        {defaultLanguages.map(lang => {
                            const isSelected = languages.includes(lang);
                            return (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => toggleLanguage(lang)}
                                    className={`inline-flex items-center px-4 py-2 rounded-full text-base transition-all duration-200 border ${isSelected
                                            ? "bg-[#10b981] border-[#10b981] text-white font-medium shadow-sm"
                                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                >
                                    {lang}
                                    {isSelected && <Check className="w-4 h-4 ml-2 text-white" strokeWidth={2.5} />}
                                </button>
                            );
                        })}

                        {languages.filter(l => !defaultLanguages.includes(l)).map(lang => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => toggleLanguage(lang)}
                                className="inline-flex items-center px-4 py-2 rounded-full text-base bg-[#10b981] border border-[#10b981] text-white font-medium shadow-sm"
                            >
                                {lang}
                                <Check className="w-4 h-4 ml-2 text-white" strokeWidth={2.5} />
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 relative" ref={langDropdownRef}>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                value={languageInput}
                                onChange={(e) => {
                                    setLanguageInput(e.target.value);
                                    setShowLangSuggestions(true);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (!languageInput.trim()) return;
                                        const exactMatch = allWorldLanguages.find(
                                            l => l.toLowerCase() === languageInput.trim().toLowerCase()
                                        );
                                        if (exactMatch) {
                                            handleAddLanguage(exactMatch);
                                            return;
                                        }
                                        if (filteredLanguages.length > 0) {
                                            handleAddLanguage(filteredLanguages[0]);
                                            return;
                                        }
                                    }
                                }}
                                onFocus={() => {
                                    if (languageInput.trim()) setShowLangSuggestions(true);
                                }}
                                className="w-full pl-7 text-sm text-gray-700 placeholder-gray-400 outline-none border-b border-gray-200 focus:border-[#10b981] py-2 transition-colors bg-transparent"
                                placeholder="Type other language and press Enter..."
                            />
                        </div>

                        {showLangSuggestions && languageInput && (
                            <div className="absolute top-full left-0 w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto mt-1">
                                {filteredLanguages.length > 0 ? (
                                    filteredLanguages.map((lang, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleAddLanguage(lang)}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-none"
                                        >
                                            {lang}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-sm text-gray-500">
                                        No matches found. Press Enter to add "{languageInput}"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end mt-1">
                    <span className={`text-xs ${languages.length >= 10 ? 'text-red-500' : 'text-gray-500'}`}>
                        Language {languages.length}/10
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
                <button
                    onClick={onBack}
                    className="flex-1 py-3.5 border border-gray-300 rounded-full text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="flex-1 py-3.5 bg-[#10b981] text-white rounded-full font-bold hover:bg-green-600 transition-colors shadow-sm"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default PostServiceSkills;
