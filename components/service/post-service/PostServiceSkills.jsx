import React, { useState, useRef, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import { SkillsSelector } from './SkillsSelector';
import { KeywordSelector } from './KeywordSelector';
import { Button } from '@/components/ui/button';

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
        initialSkillIds = [], // For editing: pass initial skill IDs
        initialKeywordNames = [] // For editing: pass initial keyword names
    } = props;



    return (
        <div>
            <SkillsSelector
                selectedSkills={skills}
                onSkillsChange={setSkills}
                initialSkillIds={initialSkillIds}
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
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="flex-1 h-11"
                >
                    Back
                </Button>
                <Button
                    type="button"
                    variant="default"
                    onClick={onNext}
                    className="flex-1 h-11"
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default PostServiceSkills;
