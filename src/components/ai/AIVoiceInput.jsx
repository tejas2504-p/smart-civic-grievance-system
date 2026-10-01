import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Native Browser Web Speech API Voice Recognition Controller
 * Zero external paid API dependencies.
 */
export default function AIVoiceInput({ onTranscript, language = 'en', disabled = false, size = 18 }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Select proper language dialect
      if (language === 'mr') recognition.lang = 'mr-IN';
      else if (language === 'hi') recognition.lang = 'hi-IN';
      else recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && onTranscript) {
          onTranscript(transcript);
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access was denied. Please allow microphone permission in your browser.');
        } else if (event.error !== 'no-speech') {
          toast.error(`Voice input error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, onTranscript]);

  const toggleListening = () => {
    if (!isSupported) {
      toast.info('Voice input is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        if (language === 'mr') recognitionRef.current.lang = 'mr-IN';
        else if (language === 'hi') recognitionRef.current.lang = 'hi-IN';
        else recognitionRef.current.lang = 'en-IN';

        recognitionRef.current?.start();
        toast.info(language === 'mr' ? 'ऐकत आहे... बोला' : language === 'hi' ? 'सुन रहा हूँ... बोलिए' : 'Listening... Speak now');
      } catch (err) {
        console.warn('Recognition start failed:', err);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      title={isListening ? 'Listening... Click to stop' : 'Click to speak'}
      style={{
        background: isListening ? '#EF4444' : 'transparent',
        color: isListening ? '#FFFFFF' : 'var(--color-text-secondary)',
        border: isListening ? '2px solid #DC2626' : '1px solid transparent',
        borderRadius: '50%',
        width: 36,
        height: 36,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {isListening ? (
        <>
          <MicOff size={size} />
          <span
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              border: '2px solid #EF4444',
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
        </>
      ) : (
        <Mic size={size} />
      )}
    </button>
  );
}
