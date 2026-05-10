import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  text: string;
  className?: string;
}

export default function SpeakButton({ text, className = '' }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean up on unmount
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const speak = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // prevent card flip
      if (!window.speechSynthesis) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;

      // Pick a Japanese voice if available
      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find((v) => v.lang.startsWith('ja'));
      if (jaVoice) utterance.voice = jaVoice;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [text]
  );

  return (
    <button
      onClick={speak}
      title="Aussprache"
      aria-label="Aussprache anhören"
      className={`inline-flex items-center justify-center rounded-full w-7 h-7 transition-colors ${
        speaking
          ? 'text-indigo-600 bg-indigo-100'
          : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50'
      } ${className}`}
    >
      {speaking ? (
        // Animated speaker (sound waves)
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
      ) : (
        // Static speaker
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      )}
    </button>
  );
}
