/**
 * Voice Settings Component
 * 
 * Settings UI for configuring voice providers, API keys,
 * voice selection, and playback options.
 * 
 * Requirements: AC4, AC5
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceStore } from '@/stores/voice';
import {
    STT_PROVIDER_INFO,
    TTS_PROVIDER_INFO,
    type STTProviderId,
    type TTSProviderId
} from '@/lib/voice/registry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Mic01Icon,
    VolumeHighIcon,
    Settings02Icon,
    CheckmarkCircle02Icon,
    Cancel01Icon,
    Loading03Icon,
    PlayCircle02Icon
} from '@hugeicons/core-free-icons';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

export function VoiceSettings() {
    const { t } = useTranslation();
    const {
        settings,
        setSettings,
        availableVoices,
        testSTTProvider,
        testTTSProvider,
        refreshVoices
    } = useVoiceStore();

    const [sttTestStatus, setSTTTestStatus] = useState<TestStatus>('idle');
    const [ttsTestStatus, setTTSTestStatus] = useState<TestStatus>('idle');
    const [previewPlaying, setPreviewPlaying] = useState<string | null>(null);

    // Refresh voices when TTS provider changes
    useEffect(() => {
        refreshVoices();
    }, [settings.ttsProvider, settings.apiKeys]);

    // Handle STT provider test
    const handleTestSTT = async () => {
        setSTTTestStatus('testing');
        try {
            const success = await testSTTProvider(settings.sttProvider);
            setSTTTestStatus(success ? 'success' : 'error');
        } catch {
            setSTTTestStatus('error');
        }
        // Reset after 3 seconds
        setTimeout(() => setSTTTestStatus('idle'), 3000);
    };

    // Handle TTS provider test
    const handleTestTTS = async () => {
        setTTSTestStatus('testing');
        try {
            const success = await testTTSProvider(settings.ttsProvider);
            setTTSTestStatus(success ? 'success' : 'error');
        } catch {
            setTTSTestStatus('error');
        }
        // Reset after 3 seconds
        setTimeout(() => setTTSTestStatus('idle'), 3000);
    };

    // Handle voice preview
    const handlePreviewVoice = async (voiceId: string, previewUrl?: string) => {
        if (previewPlaying === voiceId) {
            setPreviewPlaying(null);
            return;
        }

        setPreviewPlaying(voiceId);

        try {
            if (previewUrl) {
                // Use preview URL if available (ElevenLabs)
                const audio = new Audio(previewUrl);
                audio.onended = () => setPreviewPlaying(null);
                await audio.play();
            } else {
                // Generate a sample with the selected provider
                // This is a simplified preview - in production we'd use the TTS provider
                const synth = window.speechSynthesis;
                const utterance = new SpeechSynthesisUtterance('Hello! This is a voice preview.');
                utterance.onend = () => setPreviewPlaying(null);
                synth.speak(utterance);
            }
        } catch {
            setPreviewPlaying(null);
        }
    };

    // Get test button content
    const getTestButtonContent = (status: TestStatus) => {
        switch (status) {
            case 'testing':
                return <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />;
            case 'success':
                return <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-green-500" />;
            case 'error':
                return <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4 text-red-500" />;
            default:
                return t('common.test') || 'Test';
        }
    };

    return (
        <div className="space-y-6">
            {/* STT Settings */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <HugeiconsIcon icon={Mic01Icon} className="h-5 w-5 text-primary" />
                        {t('voice.stt.title') || 'Speech-to-Text'}
                    </CardTitle>
                    <CardDescription>
                        {t('voice.stt.description') || 'Configure how your voice is transcribed'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* STT Provider Selection */}
                    <div className="space-y-2">
                        <Label>{t('voice.provider') || 'Provider'}</Label>
                        <div className="flex gap-2">
                            <Select
                                value={settings.sttProvider}
                                onValueChange={(v) => setSettings({ sttProvider: v as STTProviderId })}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(STT_PROVIDER_INFO).map(provider => (
                                        <SelectItem key={provider.id} value={provider.id}>
                                            <div className="flex items-center gap-2">
                                                {provider.name}
                                                {provider.requiresApiKey && (
                                                    <Badge variant="outline" className="text-xs">API Key</Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleTestSTT}
                                disabled={sttTestStatus === 'testing'}
                            >
                                {getTestButtonContent(sttTestStatus)}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {STT_PROVIDER_INFO[settings.sttProvider]?.description}
                        </p>
                    </div>

                    {/* OpenAI API Key (for STT) */}
                    {settings.sttProvider === 'openai' && (
                        <div className="space-y-2">
                            <Label>{t('voice.apiKey') || 'OpenAI API Key'}</Label>
                            <Input
                                type="password"
                                placeholder="sk-..."
                                value={settings.apiKeys.openai || ''}
                                onChange={(e) => setSettings({
                                    apiKeys: { ...settings.apiKeys, openai: e.target.value }
                                })}
                            />
                        </div>
                    )}

                    {/* Language Selection */}
                    <div className="space-y-2">
                        <Label>{t('voice.language') || 'Language'}</Label>
                        <Select
                            value={settings.language}
                            onValueChange={(v) => setSettings({ language: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en-US">English (US)</SelectItem>
                                <SelectItem value="en-GB">English (UK)</SelectItem>
                                <SelectItem value="pt-BR">Português (BR)</SelectItem>
                                <SelectItem value="es-ES">Español</SelectItem>
                                <SelectItem value="fr-FR">Français</SelectItem>
                                <SelectItem value="de-DE">Deutsch</SelectItem>
                                <SelectItem value="ja-JP">日本語</SelectItem>
                                <SelectItem value="zh-CN">中文</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* TTS Settings */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <HugeiconsIcon icon={VolumeHighIcon} className="h-5 w-5 text-primary" />
                        {t('voice.tts.title') || 'Text-to-Speech'}
                    </CardTitle>
                    <CardDescription>
                        {t('voice.tts.description') || 'Configure how responses are spoken'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* TTS Provider Selection */}
                    <div className="space-y-2">
                        <Label>{t('voice.provider') || 'Provider'}</Label>
                        <div className="flex gap-2">
                            <Select
                                value={settings.ttsProvider}
                                onValueChange={(v) => setSettings({ ttsProvider: v as TTSProviderId })}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(TTS_PROVIDER_INFO).map(provider => (
                                        <SelectItem key={provider.id} value={provider.id}>
                                            <div className="flex items-center gap-2">
                                                {provider.name}
                                                {provider.requiresApiKey && (
                                                    <Badge variant="outline" className="text-xs">API Key</Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleTestTTS}
                                disabled={ttsTestStatus === 'testing'}
                            >
                                {getTestButtonContent(ttsTestStatus)}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {TTS_PROVIDER_INFO[settings.ttsProvider]?.description}
                        </p>
                    </div>

                    {/* OpenAI API Key (for TTS) */}
                    {settings.ttsProvider === 'openai' && !settings.apiKeys.openai && (
                        <div className="space-y-2">
                            <Label>{t('voice.apiKey') || 'OpenAI API Key'}</Label>
                            <Input
                                type="password"
                                placeholder="sk-..."
                                value={settings.apiKeys.openai || ''}
                                onChange={(e) => setSettings({
                                    apiKeys: { ...settings.apiKeys, openai: e.target.value }
                                })}
                            />
                        </div>
                    )}

                    {/* ElevenLabs API Key */}
                    {settings.ttsProvider === 'elevenlabs' && (
                        <div className="space-y-2">
                            <Label>{t('voice.elevenlabsKey') || 'ElevenLabs API Key'}</Label>
                            <Input
                                type="password"
                                placeholder="xi-..."
                                value={settings.apiKeys.elevenlabs || ''}
                                onChange={(e) => setSettings({
                                    apiKeys: { ...settings.apiKeys, elevenlabs: e.target.value }
                                })}
                            />
                        </div>
                    )}

                    {/* Voice Selection */}
                    <div className="space-y-2">
                        <Label>{t('voice.selectVoice') || 'Voice'}</Label>
                        <div className="flex gap-2">
                            <Select
                                value={settings.selectedVoice}
                                onValueChange={(v) => setSettings({ selectedVoice: v })}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder={t('voice.selectVoicePlaceholder') || 'Choose a voice'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableVoices.map(voice => (
                                        <SelectItem key={voice.id} value={voice.id}>
                                            <div className="flex items-center gap-2">
                                                {voice.name}
                                                <span className="text-xs text-muted-foreground">
                                                    ({voice.language})
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {settings.selectedVoice && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                        const voice = availableVoices.find(v => v.id === settings.selectedVoice);
                                        handlePreviewVoice(settings.selectedVoice, voice?.preview);
                                    }}
                                >
                                    <HugeiconsIcon
                                        icon={PlayCircle02Icon}
                                        className={`h-4 w-4 ${previewPlaying === settings.selectedVoice ? 'text-primary' : ''}`}
                                    />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Playback Speed */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>{t('voice.speed') || 'Speed'}</Label>
                            <span className="text-sm text-muted-foreground">{settings.ttsSpeed}x</span>
                        </div>
                        <Slider
                            value={[settings.ttsSpeed]}
                            min={0.5}
                            max={2}
                            step={0.1}
                            onValueChange={([value]) => setSettings({ ttsSpeed: value })}
                        />
                    </div>

                    <Separator />

                    {/* Auto-play Setting */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>{t('voice.autoPlay') || 'Auto-play responses'}</Label>
                            <p className="text-xs text-muted-foreground">
                                {t('voice.autoPlayDescription') || 'Automatically read AI responses aloud'}
                            </p>
                        </div>
                        <Switch
                            checked={settings.autoPlayResponses}
                            onCheckedChange={(v) => setSettings({ autoPlayResponses: v })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Call Mode Settings */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <HugeiconsIcon icon={Settings02Icon} className="h-5 w-5 text-primary" />
                        {t('voice.callMode.title') || 'Call Mode'}
                    </CardTitle>
                    <CardDescription>
                        {t('voice.callMode.description') || 'Settings for continuous voice conversation'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* VAD Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>{t('voice.vad') || 'Voice Activity Detection'}</Label>
                            <p className="text-xs text-muted-foreground">
                                {t('voice.vadDescription') || 'Auto-detect when you start/stop speaking'}
                            </p>
                        </div>
                        <Switch
                            checked={settings.callModeVAD}
                            onCheckedChange={(v) => setSettings({ callModeVAD: v })}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default VoiceSettings;
