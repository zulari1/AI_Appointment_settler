// constants.ts

// This environment exposes secrets via a process.env object.
// We declare it here to inform TypeScript and prevent errors.
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

// --- SECURITY WARNING ---
// The API key and webhook URLs below have hardcoded fallbacks to make the app functional
// in this specific sandboxed environment where environment variables may not be configured.
// In a real-world application, NEVER expose API keys in your frontend code.
// Always load them from secure environment variables on a server or during your build process.

// Securely load environment variables from process.env, with fallbacks for this environment.
export const N8N_WEBHOOK = process.env.VITE_N8N_WEBHOOK || 'https://atlas-ai-assistant.app.n8n.cloud/webhook/Atlas';
export const N8N_TRANSCRIBE_WEBHOOK = process.env.VITE_N8N_TRANSCRIBE_WEBHOOK;

export const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY || "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";
export const GROQ_API_URL = process.env.VITE_GROQ_API_URL || 'https://api.groq.com/openai/v1/audio/transcriptions';

// Non-secret constants
export const WAKE_WORD = 'hey atlas';