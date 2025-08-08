

import { useState, useCallback, useEffect, useRef } from 'react';
import { debug } from '../utils/debug';
import { SpeechSegment, InterviewerGender } from '../types';
import type { Language } from '../translations';
import { bcp47LanguageMap } from '../translations';

// A set of mouth shape identifiers for animation. 'X' is for the closed/neutral state.
const MOUTH_SHAPES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const preprocessTextForSpeech = (text: string): string => {
    let processedText = text.replace(/(\d+)\.(\d+)/g, (_match, integerPart, fractionalPart) => {
        const spacedFractionalPart = fractionalPart.split('').join(' ');
        return `${integerPart} point ${spacedFractionalPart}`;
    });
    processedText = processedText.replace(/use/gi, 'yuuzh');
    return processedText;
};


export const useSpeechSynthesis = (globalLanguage: Language) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [mouthShape, setMouthShape] = useState('X'); // 'X' for closed

  const utteranceQueue = useRef<SpeechSynthesisUtterance[]>([]);
  const onEndCallback = useRef<(() => void) | undefined>(undefined);
  
  const voices = useRef<Partial<Record<Language, { male: SpeechSynthesisVoice | null, female: SpeechSynthesisVoice | null }>>>({});

  const processQueue = useCallback(() => {
      const utterance = utteranceQueue.current.shift();
      if (utterance) {
          window.speechSynthesis.speak(utterance);
      } else {
          debug('SPEECH', 'Synthesis queue finished');
          setIsSpeaking(false);
          setMouthShape('X');
          if (onEndCallback.current) {
              onEndCallback.current();
              onEndCallback.current = undefined;
          }
      }
  }, []);

  const cancel = useCallback(() => {
    utteranceQueue.current = [];
    onEndCallback.current = undefined;
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setMouthShape('X');
  }, []);

  const speak = useCallback((textOrSegments: string | SpeechSegment[], onEnd?: () => void, langOrGender: Language | InterviewerGender = 'en') => {
    debug('SPEECH', 'speak() called', { textOrSegments, langOrGender, isMuted });

    if (isMuted || !window.speechSynthesis) {
        if(onEnd) onEnd();
        return;
    }
    
    cancel();

    let segments: SpeechSegment[];
    if (typeof textOrSegments === 'string') {
        const isLang = (Object.keys(bcp47LanguageMap) as Language[]).includes(langOrGender as Language);
        const lang = isLang ? langOrGender as Language : globalLanguage;
        segments = [{ text: textOrSegments, lang }];
    } else {
        segments = textOrSegments;
    }

    segments = segments.filter(s => s.text && s.text.trim().length > 0);
    
    if (segments.length === 0) {
        if(onEnd) onEnd();
        return;
    }

    const fullOriginalText = segments.map(s => s.text).join('');
    setSpokenText(fullOriginalText);

    utteranceQueue.current = segments.map(segment => {
        const processedText = preprocessTextForSpeech(segment.text);
        const utterance = new SpeechSynthesisUtterance(processedText);
        
        utterance.lang = bcp47LanguageMap[segment.lang];

        const langVoices = voices.current[segment.lang];
        let selectedVoice: SpeechSynthesisVoice | null = null;
        
        if (langVoices) {
            const isGender = langOrGender === 'male' || langOrGender === 'female';
            if (isGender && langOrGender === 'female') {
                selectedVoice = langVoices.female;
            } else if (isGender && langOrGender === 'male') {
                selectedVoice = langVoices.male;
            } else {
                // Default to female if available, otherwise male
                selectedVoice = langVoices.female || langVoices.male;
            }
        }
        
        if (!selectedVoice) {
            const allVoices = window.speechSynthesis.getVoices();
            selectedVoice = allVoices.find(v => v.lang === utterance.lang) || allVoices.find(v => v.lang.startsWith(utterance.lang.split('-')[0])) || null;
        }

        utterance.voice = selectedVoice;
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.onend = () => processQueue();
        
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const randomShape = MOUTH_SHAPES[Math.floor(Math.random() * MOUTH_SHAPES.length)];
                setMouthShape(randomShape);
            }
        };
        
        utterance.onerror = (e) => {
            debug('ERROR', 'Synthesis error in segment', { error: e.error, segment });
        };

        return utterance;
    });

    if (utteranceQueue.current.length > 0) {
        onEndCallback.current = onEnd;
        setIsSpeaking(true);
        setMouthShape('A');
        processQueue();
    } else {
        if(onEnd) onEnd();
    }
  }, [isMuted, processQueue, cancel, globalLanguage]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
        const nextState = !prev;
        if (nextState) {
            cancel();
        }
        return nextState;
    });
  }, [cancel]);

  useEffect(() => {
    const getAndSetVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length === 0) return;
      
      debug('SPEECH', 'Available synthesis voices:', allVoices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));

      const newVoicesConfig: Partial<Record<Language, { male: SpeechSynthesisVoice | null, female: SpeechSynthesisVoice | null }>> = {};

        for (const langCode of Object.keys(bcp47LanguageMap) as Language[]) {
            const bcp47 = bcp47LanguageMap[langCode];
            const langVoices = allVoices.filter(v => v.lang === bcp47 || v.lang.startsWith(langCode));

            let femaleVoice: SpeechSynthesisVoice | null = null;
            let maleVoice: SpeechSynthesisVoice | null = null;
            
            femaleVoice = langVoices.find(v => /female/i.test(v.name)) || langVoices.find(v => (v as any).gender === 'female') || null;
            maleVoice = langVoices.find(v => /male/i.test(v.name)) || langVoices.find(v => (v as any).gender === 'male') || null;

            if (langCode === 'en') {
                femaleVoice = femaleVoice || langVoices.find(v => /google/i.test(v.name) && !/male/i.test(v.name)) || langVoices.find(v => /zira/i.test(v.name)) || langVoices.find(v => /samantha/i.test(v.name));
                maleVoice = maleVoice || langVoices.find(v => /david/i.test(v.name)) || langVoices.find(v => /alex/i.test(v.name));
            } else if (langCode === 'hi') {
                femaleVoice = femaleVoice || langVoices.find(v => /kalpana/i.test(v.name)) || langVoices.find(v => /google/i.test(v.name));
                maleVoice = maleVoice || langVoices.find(v => /hemant/i.test(v.name));
            }
            
            if (!femaleVoice && !maleVoice && langVoices.length > 0) {
                const defaultVoice = langVoices.find(v => v.default);
                femaleVoice = defaultVoice || langVoices[0];
                maleVoice = defaultVoice || langVoices[0];
            } else if (!femaleVoice && maleVoice) {
                femaleVoice = maleVoice;
            } else if (femaleVoice && !maleVoice) {
                maleVoice = femaleVoice;
            }
            
            newVoicesConfig[langCode] = { female: femaleVoice, male: maleVoice };
        }
      
      voices.current = newVoicesConfig;
      debug('SPEECH', 'Processed voices set', voices.current);
    };
    
    window.speechSynthesis.addEventListener('voiceschanged', getAndSetVoices);
    getAndSetVoices();

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', getAndSetVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  return { speak, cancel, isMuted, toggleMute, isSpeaking, spokenText, mouthShape };
};