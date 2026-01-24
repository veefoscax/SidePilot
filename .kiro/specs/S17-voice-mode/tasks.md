# S17: Advanced Voice Mode - Implementation Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Implements comprehensive voice interaction with multi-provider STT/TTS support, Call Mode, and audio visualization.

---

## Phase 1: Foundation (OPUS-PAUSE)

- [x] 1. Types and Provider Interfaces
  - Create `src/lib/voice/types.ts` with all type definitions
  - Define STTProvider, TTSProvider interfaces
  - Define VoiceSettings, VoiceState types
  - Define TranscriptionResult, VoiceOption, AudioPlayback types
  - _Requirements: TR1, AC4_

- [x] 2. Provider Registry
  - Create `src/lib/voice/registry.ts`
  - Implement provider registration pattern
  - Support dynamic provider addition/removal
  - Implement getActiveSTT(), getActiveTTS() functions
  - _Requirements: TR1_

- [x] 3. Refactor Browser Providers
  - Create `src/lib/voice/providers/browser-stt.ts`
  - Create `src/lib/voice/providers/browser-tts.ts`
  - Migrate existing voice.ts logic to new provider format
  - Ensure backward compatibility
  - _Requirements: AC1.5, AC2.5_

- [x] 4. Voice Store Implementation
  - Create `src/stores/voice.ts` with Zustand
  - Implement settings persistence (chrome.storage)
  - Implement runtime state management
  - Add provider initialization logic
  - _Requirements: AC4.1_

## Phase 2: External Providers (OPUS-PAUSE)

- [x] 5. OpenAI Whisper STT Provider
  - Create `src/lib/voice/providers/openai-stt.ts`
  - Implement transcribe() for audio blobs
  - Implement startRealtime() with MediaRecorder chunking
  - Add API key validation
  - _Requirements: AC1.5, AC4.2_

- [x] 6. OpenAI TTS Provider
  - Create `src/lib/voice/providers/openai-tts.ts`
  - Implement speak() and synthesize() methods
  - Support all OpenAI voices (alloy, echo, fable, onyx, nova, shimmer)
  - Implement AudioPlayback controls
  - _Requirements: AC2.5, AC4.3_

- [x] 7. ElevenLabs TTS Provider
  - Create `src/lib/voice/providers/elevenlabs-tts.ts`
  - Implement getVoices() from ElevenLabs API
  - Implement speak() with streaming audio
  - Add voice preview support
  - _Requirements: AC2.5, AC4.3, AC5.2_

- [x] 8. Voice Settings UI
  - Create `src/components/settings/VoiceSettings.tsx`
  - Add STT/TTS provider selection dropdowns
  - Add API key input fields with secure storage
  - Add "Test" buttons for each provider
  - Add voice selection with preview
  - Integrate into Settings panel
  - _Requirements: AC4, AC5_

## Phase 3: Enhanced UI (OPUS-RECOMMENDED)

- [x] 9. Audio Visualization Component
  - Create `src/components/voice/AudioVisualizer.tsx`
  - Implement canvas-based waveform rendering
  - Support different visualization modes (waveform, bars, circle)
  - Connect to audio level from microphone
  - _Requirements: AC6_

- [x] 10. Per-Message Audio Player
  - Create `src/components/voice/MessageAudioPlayer.tsx`
  - Add play/pause button for each assistant message
  - Implement playback progress indicator
  - Add speed control (0.5x, 1x, 1.5x, 2x)
  - Integrate into AssistantMessage component
  - _Requirements: AC2.1, AC2.3_

- [x] 11. Enhance VoiceControls Component
  - Update `src/components/chat/VoiceControls.tsx`
  - Use new provider system instead of hardcoded browser API
  - Add language selection dropdown
  - Improve visual feedback during recording
  - Show interim transcript in tooltip or overlay
  - _Requirements: AC1.2, AC1.4_

## Phase 4: Call Mode (OPUS-PAUSE)

- [x] 12. Voice Activity Detection (VAD)
  - Create `src/lib/voice/vad.ts`
  - Implement Web Audio API based level detection
  - Add speech start/end detection with configurable thresholds
  - Support adjustable silence delay before auto-stop
  - _Requirements: AC3.2_

- [x] 13. Call Mode UI
  - Create `src/components/voice/CallMode.tsx`
  - Implement full-screen overlay with visualization
  - Show state indicators (listening, processing, speaking)
  - Add end call button
  - Integrate AudioVisualizer component
  - _Requirements: AC3.1, AC3.5_

- [x] 14. Call Mode Flow Implementation
  - Implement conversation loop: listen → transcribe → LLM → speak
  - Connect VAD to auto-start/stop recording
  - Auto-speak AI responses
  - Handle errors gracefully with retry/fallback
  - _Requirements: AC3.3, AC3.4_

- [x] 15. Push-to-Talk Mode
  - Add alternative PTT mode for noisy environments
  - Implement hold-to-record gesture
  - Add keyboard shortcut (Space to talk)
  - Toggle between VAD and PTT in settings
  - _Requirements: AC3.4_

## Phase 5: Polish & Testing (AUTO-OK)

- [x] 16. Language Detection/Selection
  - Add language selector to voice controls
  - Implement auto-detect option (for providers that support it)
  - Persist language preference
  - _Requirements: AC1.4_

- [x] 17. Streaming TTS Playback
  - Implement chunked audio streaming for ElevenLabs
  - Reduce time-to-first-audio
  - Add buffering indicator
  - _Requirements: TR2_

- [x] 18. Integration Testing
  - Test complete voice input flow
  - Test all TTS providers
  - Test call mode conversation loop
  - Verify API key validation
  - Test error handling and fallbacks
  - Verify performance metrics
  - _Requirements: All_

---

## Checkpoints

### After Phase 1 (Task 4)
- [x] Browser voice still works (regression test)
- [x] Voice store persists settings
- [x] Provider registry works correctly

### After Phase 2 (Task 8)
- [x] OpenAI STT transcription works
- [x] All TTS providers play audio
- [x] Settings UI functional
- [x] API keys stored securely

### After Phase 3 (Task 11)
- [x] Audio visualizer renders correctly
- [x] Per-message audio player works
- [x] VoiceControls uses new provider system

### After Phase 4 (Task 15)
- [x] Call mode starts and ends correctly
- [x] VAD detects speech start/end
- [x] Conversation loop completes successfully
- [x] PTT mode works as alternative

### Final (Task 18)
- [x] All tests passing
- [x] Performance metrics met (TR2)
- [x] No regressions in existing functionality

---

## Notes

- Phase 1 is critical - needs careful review before proceeding
- External providers require API keys - test with mocks first
- Call Mode is the most complex feature - allocate extra time
- Consider mobile/touch experience for call mode UI
- ElevenLabs has rate limits - implement caching
