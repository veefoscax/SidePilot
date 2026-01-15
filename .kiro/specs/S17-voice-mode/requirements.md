# S17: Advanced Voice Mode - Requirements

## Overview

Comprehensive voice interaction system enabling hands-free conversation with AI via multiple Speech-to-Text (STT) and Text-to-Speech (TTS) providers, including a "Call Mode" for continuous voice conversation.

## Background

Open WebUI and similar AI interfaces have pioneered voice interaction features:
- **STT Backends**: Local Whisper, OpenAI Whisper, Deepgram, Azure, Web Speech API
- **TTS Backends**: ElevenLabs, OpenAI TTS, Azure AI Speech, Browser native
- **Call Feature**: Full conversational mode with auto-detect speech

SidePilot currently has basic browser-based voice (Web Speech API only) which is:
- Low quality voices
- No external provider support
- No conversation mode
- Limited language support

## Dependencies

- S02 (Provider Factory) - API key management pattern
- S03 (Provider Settings) - Settings UI pattern
- Existing `src/lib/voice.ts` - To be refactored
- Existing `src/components/chat/VoiceControls.tsx` - To be enhanced

---

## User Stories

### US1: Voice Input for Messages
**As a** user  
**I want** to speak my messages instead of typing  
**So that** I can interact hands-free

**Acceptance Criteria:**
- [AC1.1] Microphone button in input area with visual state indicator
- [AC1.2] Real-time transcript preview while speaking (interim results)
- [AC1.3] Automatic punctuation and sentence formatting
- [AC1.4] Multi-language support with auto-detect option
- [AC1.5] Support for multiple STT providers (Browser, OpenAI Whisper)

---

### US2: Read Aloud AI Responses
**As a** user  
**I want** the AI's responses to be read aloud  
**So that** I can listen while doing other tasks

**Acceptance Criteria:**
- [AC2.1] Play button on each assistant message bubble
- [AC2.2] Auto-play option for new AI responses (configurable)
- [AC2.3] Playback controls: pause, resume, speed adjustment (0.5x-2x)
- [AC2.4] Multiple voice options from each provider
- [AC2.5] Support for multiple TTS providers (Browser, OpenAI, ElevenLabs)

---

### US3: Call/Conversation Mode
**As a** user  
**I want** a continuous voice conversation mode  
**So that** I can have hands-free, natural dialogue like with a voice assistant

**Acceptance Criteria:**
- [AC3.1] Dedicated "Call" button to start voice session
- [AC3.2] Voice Activity Detection (VAD) for auto-start/stop recording
- [AC3.3] AI response is automatically spoken after transcription
- [AC3.4] Alternative "Push-to-talk" mode for noisy environments
- [AC3.5] Visual indicators showing: listening, processing, speaking states
- [AC3.6] End call button with optional conversation summary

---

### US4: Voice Provider Configuration
**As a** user  
**I want** to choose my preferred voice providers  
**So that** I can use higher quality cloud services

**Acceptance Criteria:**
- [AC4.1] Voice settings section in Settings panel
- [AC4.2] STT provider selection: Browser (free), OpenAI Whisper
- [AC4.3] TTS provider selection: Browser (free), OpenAI TTS, ElevenLabs
- [AC4.4] API key inputs with secure storage
- [AC4.5] "Test" buttons to verify each provider configuration

---

### US5: Voice Selection & Customization
**As a** user  
**I want** to choose different voices for TTS  
**So that** I can personalize my experience

**Acceptance Criteria:**
- [AC5.1] List available voices per selected TTS provider
- [AC5.2] Audio preview before selecting a voice
- [AC5.3] Persist selected voice in settings
- [AC5.4] Voice quality/speed settings per provider

---

### US6: Audio Visualization
**As a** user  
**I want** to see visual feedback during voice interactions  
**So that** I know the system is actively listening or speaking

**Acceptance Criteria:**
- [AC6.1] Waveform/spectrum visualization during recording
- [AC6.2] Audio level indicator (microphone input)
- [AC6.3] Animation/indicator during TTS playback
- [AC6.4] Clear visual state machine: idle → listening → processing → speaking

---

## Technical Requirements

### TR1: Provider Abstraction
- Provider-agnostic interface for STT and TTS
- Easy to add new providers without breaking existing code
- Graceful fallback to browser native if cloud unavailable

### TR2: Performance
- Voice input transcription latency < 500ms (browser), < 2s (cloud)
- TTS playback start < 500ms (browser), < 2s (cloud)
- Call mode round-trip < 3s (speak → transcribe → LLM → speak)

### TR3: Security
- API keys stored encrypted in Chrome storage
- No audio data persisted unless explicitly saved
- Microphone permission requested with clear explanation

### TR4: Browser Compatibility
- Chrome 80+ with Web Speech API
- Fallback messaging for unsupported browsers
- WebRTC audio capture for higher quality when available

---

## Non-Goals (Future Work)

- Voice cloning (ElevenLabs Voice Lab integration)
- Custom wake word ("Hey SidePilot")
- Multi-speaker detection
- Audio message recording (voice notes in chat)
- Offline STT via local Whisper.cpp
