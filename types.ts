
export type Mode = 'text' | 'audio' | 'hands-free';

export interface ChatMessage {
  id: string;
  who: 'user' | 'atlas';
  text: string;
  ts: string;
}

export type SendFn = (text: string) => Promise<void>;