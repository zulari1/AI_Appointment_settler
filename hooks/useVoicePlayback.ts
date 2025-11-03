// hooks/useVoicePlayback.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatMessage } from '../types';
import { sendToWebhook, WebhookResponse, WebhookError } from '../services/n8nService';
import { playAudioFromUrl, playBase64Wave, AudioControl } from '../services/audioService';
import { getClientId } from '../services/clientId';

export function useVoicePlayback(onAmplitudeChange: (amplitude: number) => void) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem('jarvis_chat_v2');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const sendingRef = useRef(false);
  const audioControlRef = useRef<AudioControl | null>(null);
  const lastSentContentRef = useRef<string | null>(null);
  const lastSentAtRef = useRef<number>(0);
  const failCountRef = useRef(0);

  useEffect(() => { localStorage.setItem('jarvis_chat_v2', JSON.stringify(messages)); }, [messages]);

  const addMessage = useCallback((who: 'user' | 'jarvis', text: string) => {
    if (who === 'user' && text.trim().length < 1 && messages.length > 0) return;
    const msg: ChatMessage = { id: `${Date.now()}-${Math.random()}`, who, text: text.trim(), ts: new Date().toISOString() };
    setMessages((m) => [...m, msg]);
  }, [messages.length]);
  
  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem('jarvis_chat_v2');
  }, []);

  const processWebhookResponse = useCallback(async (response: WebhookResponse) => {
    addMessage('jarvis', response.reply ?? '');
    
    const audioSource = response.audio_url 
      ? playAudioFromUrl(response.audio_url) 
      : response.audio_base64 
      ? playBase64Wave(response.audio_base64, onAmplitudeChange) 
      : null;

    if (audioSource) {
      audioControlRef.current = audioSource;
      setIsPlaying(true);
      try {
        await audioSource.promise;
      } catch (e: any) {
        if (e.message !== 'Playback interrupted') {
          console.warn('Audio playback failed:', e.message);
        }
      } finally {
        setIsPlaying(false);
        audioControlRef.current = null;
      }
    }
  }, [addMessage, onAmplitudeChange]);

  const stopPlayback = useCallback(() => {
    if (audioControlRef.current) {
      audioControlRef.current.stop();
    }
  }, []);

  const sendMessage = useCallback(async (text: string, fileBlob?: Blob | File) => {
    if ((!text || !text.trim()) && !fileBlob) return;
    if (sendingRef.current) {
      console.log('Already sending a message, ignoring new request.');
      return;
    }
    const cleaned = text.trim();

    const now = Date.now();
    if (lastSentContentRef.current === cleaned && !fileBlob && now - (lastSentAtRef.current || 0) < 2000) {
      console.debug('[useVoicePlayback] Skipping duplicate send (recent) for:', cleaned);
      return;
    }
    
    addMessage('user', cleaned);

    sendingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const clientId = getClientId(); // Get persistent client id
      const response = await sendToWebhook(cleaned, clientId, fileBlob);
      lastSentContentRef.current = cleaned;
      lastSentAtRef.current = Date.now();
      await processWebhookResponse(response);
    } catch (err: any) {
      console.error('useVoicePlayback.sendMessage error', err);
      failCountRef.current++;
      console.log('Failed transcribe count:', failCountRef.current);
      let userFriendly = 'An unexpected error occurred.';
      if (err instanceof WebhookError) {
        if (err.type === 'Network') userFriendly = 'Connection failed. Check your internet.';
        if (err.type === 'Server') userFriendly = 'Service unavailable. Try again later.';
        if (err.type === 'Parse') userFriendly = 'Invalid server response from backend.';
      } else if (err instanceof Error) {
        userFriendly = err.message;
      }
      setError(userFriendly);
      addMessage('jarvis', "Sorry — I couldn't process that right now.");
    } finally {
      sendingRef.current = false;
      setIsLoading(false);
    }
  }, [addMessage, processWebhookResponse]);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    isPlaying,
    stopPlayback,
    clearMessages,
    lastSentContentRef,
  };
}
