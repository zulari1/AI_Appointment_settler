// hooks/useChatManager.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatMessage } from '../types';
import { sendToWebhook, WebhookResponse, WebhookError } from '../services/n8nService';
import { playAudioFromUrl, playBase64Wave, AudioControl } from '../services/audioService';

function makeClientRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChatManager(onAmplitudeChange: (amplitude: number) => void) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem('jarvis_chat_v2');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // internal refs
  const sendingRef = useRef(false);
  const pendingIdsRef = useRef(new Set<string>());
  const audioControlRef = useRef<AudioControl | null>(null);

  const lastSentContentRef = useRef<string | null>(null);
  const lastSentAtRef = useRef<number>(0);

  useEffect(() => { localStorage.setItem('jarvis_chat_v2', JSON.stringify(messages)); }, [messages]);

  const addMessage = useCallback((who: 'user' | 'jarvis', text: string) => {
    const msg: ChatMessage = { id: `${Date.now()}-${Math.random()}`, who, text, ts: new Date().toISOString() };
    setMessages((m) => [...m, msg]);
  }, []);
  
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

  const sendMessage = useCallback(async (text: string) => {
    if (!text || !text.trim()) return;
    const cleaned = text.trim();

    const now = Date.now();
    if (lastSentContentRef.current === cleaned && now - (lastSentAtRef.current || 0) < 2000) {
      console.debug('[useChatManager] Skipping duplicate send (recent) for:', cleaned);
      return;
    }

    const client_request_id = makeClientRequestId();
    addMessage('user', cleaned);

    while (sendingRef.current) {
      await new Promise((r) => setTimeout(r, 50));
    }

    sendingRef.current = true;
    setIsLoading(true);
    setError(null);
    pendingIdsRef.current.add(client_request_id);

    try {
      const response = await sendToWebhook(cleaned, client_request_id);
      lastSentContentRef.current = cleaned;
      lastSentAtRef.current = Date.now();
      await processWebhookResponse(response);
    // FIX: Added curly braces to the catch block to correctly scope the error handling logic.
    } catch (err: any) {
      console.error('useChatManager.sendMessage error', err);
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
      pendingIdsRef.current.delete(client_request_id);
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
