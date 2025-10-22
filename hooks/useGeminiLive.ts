import { useState, useRef, useCallback } from 'react';
import { ai } from '../services/gemini';
import { LiveSession, Modality, LiveServerMessage } from '@google/genai';
import { createBlob } from '../utils/audioUtils';
import { TranscriptEntry } from '../types';

type LiveState = 'idle' | 'connecting' | 'live' | 'error' | 'ended';

interface UseGeminiLiveProps {
    onStateChange: (state: LiveState) => void;
    onTranscriptUpdate: (entry: TranscriptEntry) => void;
    onAudio: (audioChunk: string) => void;
}

interface ConnectConfig {
    systemInstruction: string;
}

export const useGeminiLive = ({ onStateChange, onTranscriptUpdate, onAudio }: UseGeminiLiveProps) => {
    const [isMuted, setIsMuted] = useState(false);
    
    const sessionRef = useRef<LiveSession | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');
    
    const connect = useCallback(async ({ systemInstruction }: ConnectConfig) => {
        onStateChange('connecting');

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    systemInstruction,
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                },
                callbacks: {
                    onopen: () => {
                        onStateChange('live');
                        // FIX: Cast window to any to access vendor-prefixed webkitAudioContext.
                        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current!);
                        processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        processorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            if (isMuted) return;
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        sourceRef.current.connect(processorRef.current);
                        processorRef.current.connect(audioContextRef.current.destination);
                    },
                    onmessage: (message: LiveServerMessage) => {
                        // Handle Transcription
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            currentOutputTranscription.current += text;
                        } else if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            currentInputTranscription.current += text;
                        }

                        if (message.serverContent?.turnComplete) {
                            if (currentInputTranscription.current) {
                                onTranscriptUpdate({ speaker: 'user', text: currentInputTranscription.current.trim() });
                                currentInputTranscription.current = '';
                            }
                            if (currentOutputTranscription.current) {
                                onTranscriptUpdate({ speaker: 'agent', text: currentOutputTranscription.current.trim() });
                                currentOutputTranscription.current = '';
                            }
                        }

                        // Handle Audio
                        const audioChunk = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioChunk) {
                            onAudio(audioChunk);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Gemini Live Error:', e);
                        onStateChange('error');
                        cleanup();
                    },
                    onclose: (e: CloseEvent) => {
                        onStateChange('ended');
                        cleanup();
                    },
                },
            });
            sessionRef.current = await sessionPromise;
        } catch (error) {
            console.error("Failed to start Gemini Live session:", error);
            onStateChange('error');
            cleanup();
        }
    }, [isMuted, onStateChange, onTranscriptUpdate, onAudio]);

    const cleanup = () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        sourceRef.current?.disconnect();
        processorRef.current?.disconnect();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
        streamRef.current = null;
        sessionRef.current = null;
    };
    
    const disconnect = useCallback(() => {
        sessionRef.current?.close();
        cleanup();
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    return { connect, disconnect, isMuted, toggleMute };
};