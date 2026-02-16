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
        <div className="space-y-8">
            <h1 className="text-2xl font-semibold text-foreground">Skills & keywords</h1>

            <div className="">
                <SkillsSelector
                    selectedSkills={skills}
                    onSkillsChange={setSkills}
                    initialSkillIds={initialSkillIds}
                />

                <div className="space-y-2 py-2 mt-4 border-t border-border">
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
            </div>

            <div className="flex items-center gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="flex-1 "
                >
                    Back
                </Button>
                <Button
                    type="button"
                    variant="default"
                    onClick={onNext}
                    className="flex-1"
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default PostServiceSkills;
