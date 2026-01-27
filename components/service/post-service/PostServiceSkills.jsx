import React, { useState, useRef, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import { SkillsSelector } from './SkillsSelector';
import { KeywordSelector } from './KeywordSelector';

const PostServiceSkills = (props) => {
    const {
        skills, setSkills,
        languages, setLanguages,
        defaultLanguages,
        allWorldLanguages,
        onBack, onNext,
        defaultSkills,
        allSkills,
        searchTags, setSearchTags,
        initialSkillNames = [], // For editing: pass initial skill names
        initialKeywordNames = [] // For editing: pass initial keyword names
    } = props;



    return (
        <div>
            <SkillsSelector
                selectedSkills={skills}
                onSkillsChange={setSkills}
                initialSkillNames={initialSkillNames}
            />

            <div className="mt-8">
                <KeywordSelector
                    selectedKeywords={searchTags}
                    onKeywordsChange={(newKeywords) => {
                        if (newKeywords.length <= 5) {
                            setSearchTags(newKeywords);
                        }
                    }}
                    maxKeywords={5}
                    initialKeywordNames={initialKeywordNames}
                />
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
