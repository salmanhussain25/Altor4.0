import React from 'react';
import { AwardIcon } from './icons/AwardIcon';
import { useTranslations } from '../hooks/useTranslations';

interface CourseCompletionScreenProps {
  courseName: string;
  onBackToDashboard: () => void;
}

export const CourseCompletionScreen: React.FC<CourseCompletionScreenProps> = ({ courseName, onBackToDashboard }) => {
  const { t } = useTranslations();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans fade-in">
        <div className="text-center p-8 bg-gray-800/50 rounded-2xl shadow-2xl border border-gray-700 max-w-2xl">
            <div className="flex justify-center mb-6">
                <AwardIcon className="w-24 h-24 text-yellow-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
                {t('completion.congratulations')}
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-8">
                {t('completion.courseCompleted', { courseName })}
            </p>
            <p className="text-gray-400 mb-8">{t('completion.checkDashboard')}</p>
            <button
                onClick={onBackToDashboard}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
            >
                {t('completion.backToDashboard')}
            </button>
        </div>
    </div>
  );
};