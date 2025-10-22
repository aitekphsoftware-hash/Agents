import React, { useState, useEffect, useRef } from 'react';
import { Template, CallState, KeypadValue, TranscriptEntry } from '../types';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { generateIVRAudio } from '../services/gemini';
import { AudioPlayer } from '../utils/audioPlayer';

const KeypadButton: React.FC<{ value: KeypadValue | string; subtext?: string; onClick: (key: KeypadValue | string) => void; className?: string }> = ({ value, subtext, onClick, className = '' }) => (
  <button onClick={() => onClick(value)} className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-colors bg-white/10 hover:bg-white/20 active:bg-white/30 ${className}`}>
    <span className="text-3xl font-light">{value}</span>
    {subtext && <span className="text-xs tracking-widest uppercase">{subtext}</span>}
  </button>
);

const ActionButton: React.FC<{ icon: string; label: string; onClick?: () => void; className?: string, active?: boolean }> = ({ icon, label, onClick, className, active }) => (
    <div className="flex flex-col items-center gap-2">
        <button onClick={onClick} className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-white text-black' : 'bg-white/20 hover:bg-white/30'} ${className}`}>
            <i className={`fas ${icon} text-2xl`}></i>
        </button>
        <span className="text-xs">{label}</span>
    </div>
);

const TranscriptBubble: React.FC<{ entry: TranscriptEntry }> = ({ entry }) => (
    <div className={`flex my-1 ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`px-3 py-2 rounded-2xl max-w-[80%] ${entry.speaker === 'user' ? 'bg-blue-600 rounded-br-lg' : 'bg-gray-700 rounded-bl-lg'}`}>
           <p className="text-sm">{entry.text}</p>
        </div>
    </div>
);

export const Dialer: React.FC<{ selectedTemplate: Template; isFocused: boolean; isMobile?: boolean }> = ({ selectedTemplate, isFocused, isMobile = false }) => {
    const [number, setNumber] = useState('');
    const [callState, setCallState] = useState<CallState>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [callDuration, setCallDuration] = useState(0);
    
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const audioPlayerRef = useRef<AudioPlayer | null>(null);

    const { connect, disconnect, isMuted, toggleMute } = useGeminiLive({
        onStateChange: (state) => {
            if (state === 'live') setCallState('live');
            if (state === 'error') {
                setCallState('error');
                addTranscript({ speaker: 'system', text: 'Connection error. Please try again.'});
            }
        },
        onTranscriptUpdate: addTranscript,
        onAudio: (audioChunk) => {
            audioPlayerRef.current?.addChunk(audioChunk);
        }
    });

    function addTranscript(entry: TranscriptEntry) {
        setTranscript(prev => {
            // Avoid duplicate system messages
            if (entry.speaker === 'system' && prev.some(p => p.text === entry.text)) return prev;
            // Combine consecutive transcript parts from the same speaker
            const lastEntry = prev[prev.length - 1];
            if (lastEntry && lastEntry.speaker === entry.speaker) {
                 const updatedLastEntry = { ...lastEntry, text: lastEntry.text + ' ' + entry.text };
                 return [...prev.slice(0, -1), updatedLastEntry];
            }
            return [...prev, entry];
        });
    }

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    useEffect(() => {
      // FIX: Changed NodeJS.Timeout to ReturnType<typeof setInterval> for browser compatibility.
      let interval: ReturnType<typeof setInterval>;
      if (callState === 'live') {
        setCallDuration(0);
        interval = setInterval(() => {
          setCallDuration(d => d + 1);
        }, 1000);
      }
      return () => clearInterval(interval);
    }, [callState]);

    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      return `${mins}:${secs}`;
    };

    const handleKeyPress = (key: KeypadValue | string) => {
        if (callState !== 'idle') return;
        if (key === 'del') {
            setNumber(n => n.slice(0, -1));
        } else if (number.length < 15) {
            setNumber(n => n + key);
        }
    };

    const playRinging = () => {
        // Simple audio simulation
        const playRing = () => {
            // FIX: Cast window to any to access vendor-prefixed webkitAudioContext.
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
            oscillator.connect(audioCtx.destination);
            oscillator.start();
            setTimeout(() => oscillator.stop(), 800);
        }
        playRing();
        setTimeout(playRing, 2000);
    }
    
    const startCall = async () => {
        if (!number || callState !== 'idle') return;
        
        audioPlayerRef.current = new AudioPlayer();
        setTranscript([]);
        setCallDuration(0);

        // 1. Ringing
        setCallState('ringing');
        addTranscript({ speaker: 'system', text: `Calling ${number}...` });
        playRinging();

        await new Promise(res => setTimeout(res, 2500));

        // 2. IVR
        setCallState('ivr');
        addTranscript({ speaker: 'system', text: `Connecting to IVR...` });
        try {
            const companyName = selectedTemplate.name.replace(' CSR', '');
            const ivrAudioBase64 = await generateIVRAudio(companyName);
            await audioPlayerRef.current.playBase64(ivrAudioBase64);
        } catch (e) {
            console.error("IVR audio generation failed", e);
            addTranscript({ speaker: 'system', text: 'IVR system unavailable.' });
        }
        
        // 3. Connect to Live Agent
        setCallState('connecting');
        addTranscript({ speaker: 'system', text: 'Connecting to an agent...' });
        connect({ systemInstruction: selectedTemplate.systemInstruction });
    };

    const endCall = () => {
        disconnect();
        audioPlayerRef.current?.stop();
        audioPlayerRef.current = null;
        setCallState('ended');
        addTranscript({ speaker: 'system', text: 'Call ended.'});
        setTimeout(() => {
            setCallState('idle');
            setNumber('');
            setTranscript([]);
            setCallDuration(0);
        }, 2000);
    };

    const keypadValues: { val: KeypadValue, sub: string }[] = [
        { val: '1', sub: '' }, { val: '2', sub: 'ABC' }, { val: '3', sub: 'DEF' },
        { val: '4', sub: 'GHI' }, { val: '5', sub: 'JKL' }, { val: '6', sub: 'MNO' },
        { val: '7', sub: 'PQRS' }, { val: '8', sub: 'TUV' }, { val: '9', sub: 'WXYZ' },
        { val: '*', sub: '' }, { val: '0', sub: '+' }, { val: '#', sub: '' },
    ];
    
    const renderCallScreen = () => (
        <div className="flex flex-col h-full p-4 text-white bg-gray-900">
            <div className="text-center pt-8">
                <p className="text-3xl font-semibold">{number || 'Unknown'}</p>
                <p className="text-gray-400 mt-1">
                    {callState === 'live' ? formatDuration(callDuration) : callState + '...'}
                </p>
            </div>
            
            <div className="flex-1 my-4 overflow-y-auto scroll-slim px-2">
                {transcript.map((entry, i) => (
                    entry.speaker === 'system' 
                        ? <p key={i} className="text-center text-xs text-gray-500 my-2">{entry.text}</p>
                        : <TranscriptBubble key={i} entry={entry} />
                ))}
                <div ref={transcriptEndRef} />
            </div>

            <div className="grid grid-cols-3 gap-6 my-4">
                 <ActionButton icon="fa-microphone-slash" label="mute" onClick={toggleMute} active={isMuted} />
                 <ActionButton icon="fa-grip" label="keypad" />
                 <ActionButton icon="fa-volume-up" label="speaker" active={true}/>
            </div>

            <div className="flex justify-center items-center py-4">
                <button onClick={endCall} className="w-20 h-20 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600">
                    <i className="fas fa-phone-slash text-3xl"></i>
                </button>
            </div>
        </div>
    );
    
    const renderDialerScreen = () => (
        <div className="flex flex-col items-center justify-between h-full p-4 text-white">
            <div className="text-center mt-4 h-20">
              <p className="text-lg text-gray-300">{selectedTemplate.name}</p>
              <input type="text" readOnly value={number} className="bg-transparent text-center text-4xl font-light tracking-wider w-full outline-none mt-2" placeholder="Dial Number"/>
            </div>

            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                {keypadValues.map(k => <KeypadButton key={k.val} value={k.val} subtext={k.sub} onClick={handleKeyPress} />)}
            </div>
            
            <div className="flex items-center justify-center gap-4 w-full">
                 <div className="w-20"></div>
                 <button onClick={startCall} className="w-20 h-20 rounded-full flex items-center justify-center bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:opacity-50" disabled={!number}>
                    <i className="fas fa-phone text-3xl"></i>
                 </button>
                 <button onClick={() => handleKeyPress('del')} className="w-20 h-20 flex items-center justify-center text-2xl text-gray-400">
                    <i className="fas fa-delete-left"></i>
                 </button>
            </div>
        </div>
    );

    return (
        <aside className={`bg-black rounded-3xl h-full shadow-2xl shadow-black/50 border-4 border-gray-800 flex flex-col overflow-hidden ${isMobile ? 'h-full' : 'sticky top-20'}`}>
            {callState !== 'idle' && callState !== 'ended' ? renderCallScreen() : renderDialerScreen()}
             {callState === 'ended' && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                    <p className="text-xl">Call Ended</p>
                </div>
            )}
            {callState === 'error' && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-xl text-red-500">Connection Error</p>
                    <p className="text-sm text-gray-400 mt-2">Could not connect to the agent. Please check your connection and microphone permissions, then try again.</p>
                </div>
            )}
        </aside>
    );
};