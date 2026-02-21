// Configuration
const ASSEMBLYAI_API_KEY = 'b48d02f9d202469dbf7d4c77402bb86e';
const WEBSOCKET_URL = 'wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000';

export type VoiceStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface VoiceServiceCallbacks {
  onPartialTranscript: (text: string) => void;
  onFinalTranscript: (text: string) => void;
  onError: (error: string) => void;
  onStatusChange: (status: VoiceStatus) => void;
}

export class VoiceService {
  private socket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private input: MediaStreamAudioSourceNode | null = null;
  private callbacks: VoiceServiceCallbacks;

  constructor(callbacks: VoiceServiceCallbacks) {
    this.callbacks = callbacks;
  }

  public async startRecording() {
    this.callbacks.onStatusChange('connecting');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize Audio Context (must be 16kHz for AssemblyAI real-time)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      // Connect WebSocket
      this.socket = new WebSocket(WEBSOCKET_URL);

      this.socket.onopen = () => {
        this.callbacks.onStatusChange('connected');
        // Authenticate
        if (this.socket) {
            this.socket.send(JSON.stringify({ 
                audio_data: window.btoa(String.fromCharCode(...new Uint8Array(new TextEncoder().encode(JSON.stringify({ 
                    authorization_token: ASSEMBLYAI_API_KEY 
                }))))) // Actually, for the query param URL, we usually send token in headers or just raw message, 
                       // but AssemblyAI Realtime expects the token to be passed or headers. 
                       // The provided prompt specified sending a message.
            }));
            
            // Send token as first message per prompt instructions
            this.socket.send(JSON.stringify({ "authorization_token": ASSEMBLYAI_API_KEY }));
        }
      };

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.message_type === 'SessionBegins') {
            // Send Config
            this.socket?.send(JSON.stringify({
                config: {
                    sample_rate: 16000,
                    language_code: "en_us",
                    speaker_labels: false,
                    format_text: true,
                    punctuate: true
                }
            }));
            this.startAudioProcessing();
        } else if (data.message_type === 'PartialTranscript') {
            if (data.text) this.callbacks.onPartialTranscript(data.text);
        } else if (data.message_type === 'FinalTranscript') {
            if (data.text) this.callbacks.onFinalTranscript(data.text);
        }
      };

      this.socket.onerror = (event) => {
        console.error("WebSocket Error", event);
        this.callbacks.onError("Voice connection error");
        this.stopRecording();
      };

      this.socket.onclose = () => {
        this.callbacks.onStatusChange('disconnected');
      };

    } catch (error) {
      console.error("Mic Access Error", error);
      this.callbacks.onError("Microphone access denied");
      this.callbacks.onStatusChange('disconnected');
    }
  }

  private startAudioProcessing() {
    if (!this.audioContext || !this.mediaStream) return;

    this.input = this.audioContext.createMediaStreamSource(this.mediaStream);
    // 4096 buffer size offers a balance between latency and performance
    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.input.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);

    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      
      // Convert Float32 (Browser) to Int16 (AssemblyAI requirement)
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        // Clamp and scale
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Convert to Base64
      let binary = '';
      const bytes = new Uint8Array(pcmData.buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = window.btoa(binary);

      // Send to WebSocket
      this.socket.send(JSON.stringify({ audio_data: base64Audio }));
    };
  }

  public stopRecording() {
    this.callbacks.onStatusChange('disconnected');

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.scriptProcessor) {
        this.scriptProcessor.disconnect();
        this.scriptProcessor = null;
    }

    if (this.input) {
        this.input.disconnect();
        this.input = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}