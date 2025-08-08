import React, { useState, useEffect } from 'react';
import { CodeIcon } from './icons/CodeIcon';
import { SendIcon } from './icons/SendIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { VisualAid } from '../types';
import { CodeEditor } from './CodeEditor';
import { useTranslations } from '../hooks/useTranslations';
import { P5Canvas } from './P5Canvas';


interface WhiteboardProps {
  isEditable: boolean;
  showSubmitButton: boolean;
  displayCode: string;
  userCode: string;
  onCodeChange: (value: string) => void;
  onSubmitCode: () => void;
  isLoading: boolean;
  visualAid: VisualAid | null;
  language: string;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  isEditable,
  showSubmitButton,
  displayCode,
  userCode,
  onCodeChange,
  onSubmitCode,
  isLoading,
  visualAid,
  language
}) => {
  const [activeTab, setActiveTab] = useState<'CODE' | 'ANIMATION'>('CODE');
  const { t } = useTranslations();

  // When a visual aid becomes available, switch to its tab automatically
  useEffect(() => {
    if (visualAid) {
      setActiveTab('ANIMATION');
    }
  }, [visualAid]);
  
  // When there's no visual aid (e.g., new lesson), switch back to code
  useEffect(() => {
      if(!visualAid) {
          setActiveTab('CODE');
      }
  }, [visualAid]);

  const isSubmittable = isEditable && userCode.trim() !== '' && !isLoading;

  return (
    <div className="bg-gray-800 rounded-2xl flex flex-col flex-1 min-h-0 shadow-2xl border border-gray-700 overflow-hidden">
      <div className="flex-shrink-0 bg-gray-900/80 p-2 pr-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center">
            <button 
                onClick={() => setActiveTab('CODE')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${activeTab === 'CODE' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
            >
                <CodeIcon className="w-5 h-5" />
                <span>{t('misc.code')}</span>
            </button>
            {visualAid && (
                 <button 
                    onClick={() => setActiveTab('ANIMATION')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${activeTab === 'ANIMATION' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                    <SparklesIcon className="w-5 h-5" />
                    <span>{t('misc.animation')}</span>
                </button>
            )}
        </div>
        <span className="text-gray-400 text-sm font-medium">{t('misc.whiteboard')}</span>
      </div>
      <div className="relative flex-1 bg-[#1e1e1e]">
        {activeTab === 'CODE' ? (
          <>
            <CodeEditor
                value={isEditable ? userCode : displayCode}
                onChange={onCodeChange}
                readOnly={!isEditable}
                language={language}
            />
            {showSubmitButton && (
              <button
                onClick={onSubmitCode}
                disabled={!isSubmittable}
                title={isSubmittable ? t('misc.submit') : t('misc.enterCodeToSubmit')}
                className={`absolute bottom-4 right-4 flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 transform 
                  ${isSubmittable 
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg scale-100 hover:scale-105' 
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <SendIcon className="w-7 h-7" />
                )}
              </button>
            )}
          </>
        ) : visualAid ? (
          <P5Canvas sketchCode={visualAid.content} title={visualAid.title} />
        ) : null}
      </div>
    </div>
  );
};