import React, { useState, useRef, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import TagInput from '@/components/ui/TagInput';

const PostServiceSkills = (props) => {
    const {
        skills, setSkills,
        languages, setLanguages,
        defaultLanguages,
        allWorldLanguages,
        onBack, onNext,
        defaultSkills,
        allSkills,
        searchTags, setSearchTags
    } = props;



    return (
        <div>
            <TagInput
                label="Skills"
                tags={skills}
                onChange={setSkills}
                defaultTags={defaultSkills}
                options={allSkills}
                helperText="Search and select your skills from the list"
            />

            <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Search Tags</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Tag your Gig with buzz words that are relevant to the services you offer. Use all 5 tags to get found.
                </p>
                <TagInput
                    label="Positive keywords"
                    tags={searchTags}
                    onChange={(newTags) => {
                        if (newTags.length <= 5) {
                            setSearchTags(newTags);
                        }
                    }}
                    placeholder="Enter search terms"
                    helperText="5 tags maximum. Use letters and numbers only."
                    maxLength={20} // Limit char length per tag
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
