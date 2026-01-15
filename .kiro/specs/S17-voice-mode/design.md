# S17: Advanced Voice Mode - Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Voice Manager                          │
│  ┌─────────────────────┐    ┌──────────────────────────┐   │
│  │    STT Registry     │    │      TTS Registry        │   │
│  │  ┌───────────────┐  │    │  ┌────────────────────┐  │   │
│  │  │ Browser STT   │  │    │  │ Browser TTS        │  │   │
│  │  │ OpenAI Whisper│  │    │  │ OpenAI TTS         │  │   │
│  │  │ (Deepgram)    │  │    │  │ ElevenLabs TTS     │  │   │
│  │  └───────────────┘  │    │  └────────────────────┘  │   │
│  └─────────────────────┘    └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Voice Store (Zustand)                   │
│  - activeSTTProvider      - selectedVoice                   │
│  - activeTTSProvider      - isListening                     │
│  - providerConfigs        - isSpeaking                      │
│  - callModeActive         - audioLevel                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        UI Components                        │
│  ┌──────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │VoiceControls │  │  CallMode   │  │ VoiceSettings   │    │
│  │(enhanced)    │  │  (new)      │  │ (new)           │    │
│  └──────────────┘  └─────────────┘  └─────────────────┘    │
│  ┌──────────────┐  ┌─────────────┐                         │
│  │AudioPlayer   │  │AudioVisual- │                         │
│  │(per message) │  │izer        │                         │
│  └──────────────┘  └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Type Definitions

```typescript
// src/lib/voice/types.ts

/**
 * Base voice provider interface
 */
interface VoiceProvider {
  id: string;
  name: string;
  type: 'stt' | 'tts';
  requiresApiKey: boolean;
  isAvailable: () => Promise<boolean>;
}

/**
 * Speech-to-Text Provider
 */
interface STTProvider extends VoiceProvider {
  type: 'stt';
  supportsRealtime: boolean;
  supportedLanguages: string[];
  
  // One-shot transcription (for audio files/blobs)
  transcribe(audio: Blob, options?: STTOptions): Promise<TranscriptionResult>;
  
  // Real-time transcription (for microphone input)
  startRealtime(
    onResult: (result: TranscriptionResult) => void,
    options?: STTOptions
  ): Promise<RealtimeSession>;
}

interface STTOptions {
  language?: string;
  interimResults?: boolean;
  punctuate?: boolean;
}

interface TranscriptionResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
  language?: string;
}

interface RealtimeSession {
  stop: () => void;
  isActive: () => boolean;
}

/**
 * Text-to-Speech Provider
 */
interface TTSProvider extends VoiceProvider {
  type: 'tts';
  supportsStreaming: boolean;
  
  // Get available voices
  getVoices(): Promise<VoiceOption[]>;
  
  // Speak text
  speak(text: string, options?: TTSOptions): Promise<AudioPlayback>;
  
  // Get audio without playing (for caching/download)
  synthesize(text: string, options?: TTSOptions): Promise<Blob>;
}

interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  preview?: string; // URL to sample audio
}

interface TTSOptions {
  voice?: string;
  speed?: number;  // 0.5 - 2.0
  pitch?: number;  // 0.5 - 2.0
  volume?: number; // 0.0 - 1.0
}

interface AudioPlayback {
  play: () => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  onEnd: (callback: () => void) => void;
  getProgress: () => number; // 0.0 - 1.0
}

/**
 * Voice Settings
 */
interface VoiceSettings {
  sttProvider: string; // 'browser' | 'openai' | 'deepgram'
  ttsProvider: string; // 'browser' | 'openai' | 'elevenlabs'
  selectedVoice: string;
  autoPlayResponses: boolean;
  callModeVAD: boolean;
  language: string;
  apiKeys: {
    openai?: string;
    elevenlabs?: string;
    deepgram?: string;
  };
}

/**
 * Voice Store State
 */
interface VoiceState {
  // Settings
  settings: VoiceSettings;
  
  // Runtime state
  isListening: boolean;
  isSpeaking: boolean;
  callModeActive: boolean;
  callModeState: 'idle' | 'listening' | 'processing' | 'speaking';
  audioLevel: number; // 0.0 - 1.0
  interimTranscript: string;
  
  // Providers
  activeSTTProvider: STTProvider | null;
  activeTTSProvider: TTSProvider | null;
  availableVoices: VoiceOption[];
  
  // Actions
  setSettings: (settings: Partial<VoiceSettings>) => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  startCallMode: () => void;
  endCallMode: () => void;
  initializeProviders: () => Promise<void>;
}
```

---

## Provider Implementations

### Browser STT Provider

```typescript
// src/lib/voice/providers/browser-stt.ts
export const browserSTTProvider: STTProvider = {
  id: 'browser',
  name: 'Browser (Free)',
  type: 'stt',
  requiresApiKey: false,
  supportsRealtime: true,
  supportedLanguages: ['en-US', 'es-ES', 'pt-BR', 'fr-FR', 'de-DE', 'ja-JP', 'zh-CN'],
  
  async isAvailable(): Promise<boolean> {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  },
  
  async transcribe(audio: Blob, options?: STTOptions): Promise<TranscriptionResult> {
    // Browser doesn't support one-shot, would need to play audio and capture
    throw new Error('Browser STT only supports realtime mode');
  },
  
  async startRealtime(onResult, options): Promise<RealtimeSession> {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = options?.interimResults ?? true;
    recognition.lang = options?.language || 'en-US';
    
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      onResult({
        text: result[0].transcript,
        isFinal: result.isFinal,
        confidence: result[0].confidence,
      });
    };
    
    recognition.start();
    
    return {
      stop: () => recognition.stop(),
      isActive: () => true, // TODO: track actual state
    };
  }
};
```

### OpenAI Whisper STT Provider

```typescript
// src/lib/voice/providers/openai-stt.ts
export function createOpenAISTTProvider(apiKey: string): STTProvider {
  return {
    id: 'openai',
    name: 'OpenAI Whisper',
    type: 'stt',
    requiresApiKey: true,
    supportsRealtime: false, // Uses audio chunks
    supportedLanguages: ['auto', ...ISO_LANGUAGES],
    
    async isAvailable(): Promise<boolean> {
      if (!apiKey) return false;
      try {
        // Test API key validity
        const res = await fetch('https://api.openai.com/v1/models/whisper-1', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    
    async transcribe(audio: Blob, options?: STTOptions): Promise<TranscriptionResult> {
      const formData = new FormData();
      formData.append('file', audio, 'audio.webm');
      formData.append('model', 'whisper-1');
      if (options?.language && options.language !== 'auto') {
        formData.append('language', options.language);
      }
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData,
      });
      
      const data = await response.json();
      return {
        text: data.text,
        isFinal: true,
        language: data.language,
      };
    },
    
    async startRealtime(onResult, options): Promise<RealtimeSession> {
      // Use MediaRecorder to capture chunks and send to Whisper
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      let isActive = true;
      
      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0 && isActive) {
          const result = await this.transcribe(e.data, options);
          onResult(result);
        }
      };
      
      recorder.start(3000); // Chunk every 3 seconds
      
      return {
        stop: () => {
          isActive = false;
          recorder.stop();
          stream.getTracks().forEach(t => t.stop());
        },
        isActive: () => isActive,
      };
    }
  };
}
```

### ElevenLabs TTS Provider

```typescript
// src/lib/voice/providers/elevenlabs-tts.ts
export function createElevenLabsTTSProvider(apiKey: string): TTSProvider {
  const baseUrl = 'https://api.elevenlabs.io/v1';
  
  return {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    type: 'tts',
    requiresApiKey: true,
    supportsStreaming: true,
    
    async isAvailable(): Promise<boolean> {
      if (!apiKey) return false;
      try {
        const res = await fetch(`${baseUrl}/voices`, {
          headers: { 'xi-api-key': apiKey }
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    
    async getVoices(): Promise<VoiceOption[]> {
      const res = await fetch(`${baseUrl}/voices`, {
        headers: { 'xi-api-key': apiKey }
      });
      const data = await res.json();
      
      return data.voices.map((v: any) => ({
        id: v.voice_id,
        name: v.name,
        language: v.labels?.language || 'en',
        gender: v.labels?.gender,
        preview: v.preview_url,
      }));
    },
    
    async speak(text: string, options?: TTSOptions): Promise<AudioPlayback> {
      const audio = await this.synthesize(text, options);
      const audioUrl = URL.createObjectURL(audio);
      const audioElement = new Audio(audioUrl);
      
      if (options?.speed) audioElement.playbackRate = options.speed;
      
      await audioElement.play();
      
      return {
        play: () => audioElement.play(),
        pause: () => audioElement.pause(),
        stop: () => {
          audioElement.pause();
          audioElement.currentTime = 0;
        },
        setSpeed: (speed) => { audioElement.playbackRate = speed; },
        onEnd: (cb) => { audioElement.onended = cb; },
        getProgress: () => audioElement.currentTime / audioElement.duration,
      };
    },
    
    async synthesize(text: string, options?: TTSOptions): Promise<Blob> {
      const voiceId = options?.voice || 'EXAVITQu4vr4xnSDxMaL'; // Default: Bella
      
      const res = await fetch(`${baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });
      
      return res.blob();
    },
  };
}
```

---

## Voice Activity Detection (VAD)

```typescript
// src/lib/voice/vad.ts
export class VoiceActivityDetector {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private minDecibels = -60;
  private silenceThreshold = 0.01;
  private silenceDelay = 1500; // ms of silence before stop
  
  private onSpeechStart?: () => void;
  private onSpeechEnd?: () => void;
  private onAudioLevel?: (level: number) => void;
  
  async start(stream: MediaStream) {
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.minDecibels = this.minDecibels;
    
    source.connect(this.analyser);
    
    this.detectActivity();
  }
  
  private detectActivity() {
    const bufferLength = this.analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    let isSpeaking = false;
    let silenceStart = 0;
    
    const check = () => {
      this.analyser.getFloatTimeDomainData(dataArray);
      
      // Calculate RMS (volume level)
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      
      this.onAudioLevel?.(Math.min(rms * 10, 1)); // Normalize to 0-1
      
      if (rms > this.silenceThreshold) {
        if (!isSpeaking) {
          isSpeaking = true;
          this.onSpeechStart?.();
        }
        silenceStart = 0;
      } else if (isSpeaking) {
        if (!silenceStart) {
          silenceStart = Date.now();
        } else if (Date.now() - silenceStart > this.silenceDelay) {
          isSpeaking = false;
          this.onSpeechEnd?.();
        }
      }
      
      requestAnimationFrame(check);
    };
    
    check();
  }
  
  onSpeechStartCallback(cb: () => void) { this.onSpeechStart = cb; }
  onSpeechEndCallback(cb: () => void) { this.onSpeechEnd = cb; }
  onAudioLevelCallback(cb: (level: number) => void) { this.onAudioLevel = cb; }
}
```

---

## UI Components

### Voice Settings Panel

```tsx
// src/components/settings/VoiceSettings.tsx
export function VoiceSettings() {
  const { settings, setSettings, availableVoices } = useVoiceStore();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* STT Provider */}
        <div className="space-y-2">
          <Label>Speech-to-Text</Label>
          <Select 
            value={settings.sttProvider}
            onValueChange={(v) => setSettings({ sttProvider: v })}
          >
            <SelectItem value="browser">Browser (Free)</SelectItem>
            <SelectItem value="openai">OpenAI Whisper</SelectItem>
          </Select>
        </div>
        
        {/* TTS Provider */}
        <div className="space-y-2">
          <Label>Text-to-Speech</Label>
          <Select 
            value={settings.ttsProvider}
            onValueChange={(v) => setSettings({ ttsProvider: v })}
          >
            <SelectItem value="browser">Browser (Free)</SelectItem>
            <SelectItem value="openai">OpenAI TTS</SelectItem>
            <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
          </Select>
        </div>
        
        {/* API Keys */}
        {settings.ttsProvider === 'elevenlabs' && (
          <div className="space-y-2">
            <Label>ElevenLabs API Key</Label>
            <Input 
              type="password"
              value={settings.apiKeys.elevenlabs || ''}
              onChange={(e) => setSettings({ 
                apiKeys: { ...settings.apiKeys, elevenlabs: e.target.value }
              })}
            />
            <Button size="sm" onClick={testElevenLabs}>Test</Button>
          </div>
        )}
        
        {/* Voice Selection */}
        <div className="space-y-2">
          <Label>Voice</Label>
          <Select value={settings.selectedVoice}>
            {availableVoices.map(v => (
              <SelectItem key={v.id} value={v.id}>
                {v.name} ({v.language})
              </SelectItem>
            ))}
          </Select>
        </div>
        
        {/* Auto-play */}
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={settings.autoPlayResponses}
            onCheckedChange={(v) => setSettings({ autoPlayResponses: v })}
          />
          <Label>Auto-play AI responses</Label>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Call Mode Component

```tsx
// src/components/voice/CallMode.tsx
export function CallMode() {
  const { 
    callModeActive, 
    callModeState, 
    audioLevel,
    startCallMode,
    endCallMode 
  } = useVoiceStore();
  
  if (!callModeActive) return null;
  
  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex flex-col items-center justify-center">
      {/* Audio Visualizer */}
      <div className="w-64 h-64 relative">
        <AudioVisualizer level={audioLevel} state={callModeState} />
      </div>
      
      {/* State indicator */}
      <div className="mt-8 text-lg">
        {callModeState === 'listening' && 'Listening...'}
        {callModeState === 'processing' && 'Thinking...'}
        {callModeState === 'speaking' && 'Speaking...'}
        {callModeState === 'idle' && 'Ready'}
      </div>
      
      {/* End call button */}
      <Button 
        size="lg" 
        variant="destructive" 
        onClick={endCallMode}
        className="mt-8"
      >
        <PhoneOff className="mr-2" />
        End Call
      </Button>
    </div>
  );
}
```

---

## File Structure

```
src/lib/voice/
├── types.ts                 # Type definitions
├── registry.ts              # Provider registry
├── vad.ts                   # Voice Activity Detection
├── providers/
│   ├── browser-stt.ts       # Browser Web Speech API STT
│   ├── browser-tts.ts       # Browser SpeechSynthesis TTS
│   ├── openai-stt.ts        # OpenAI Whisper STT
│   ├── openai-tts.ts        # OpenAI TTS
│   └── elevenlabs-tts.ts    # ElevenLabs TTS

src/stores/
└── voice.ts                 # Voice Zustand store

src/components/
├── voice/
│   ├── CallMode.tsx         # Full-screen call mode
│   ├── AudioVisualizer.tsx  # Canvas visualization
│   └── MessageAudioPlayer.tsx # Per-message TTS controls
├── chat/
│   └── VoiceControls.tsx    # Enhanced voice controls (existing)
└── settings/
    └── VoiceSettings.tsx    # Settings panel
```
