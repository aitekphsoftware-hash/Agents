import React, { useState, useEffect, useRef } from 'react';
import { Template, CallState, KeypadValue, TranscriptEntry } from '../types';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { generateIVRAudio } from '../services/gemini';
import { AudioPlayer } from '../utils/audioPlayer';

const KeypadButton: React.FC<{ value: KeypadValue | string; subtext?: string; onClick: (key: KeypadValue | string) => void; className?: string }> = ({ value, subtext, onClick, className = '' }) => (
  <button onClick={() => onClick(value)} className={`w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center transition-colors duration-200 bg-zinc-800/80 hover:bg-zinc-700/80 active:bg-zinc-600/80 ${className}`}>
    <span className="text-4xl font-normal tracking-wider">{value}</span>
    {subtext && <span className="text-[10px] font-bold tracking-[2px] text-zinc-300 -mt-1">{subtext}</span>}
  </button>
);

const ActionButton: React.FC<{ icon: string; label: string; onClick?: () => void; active?: boolean }> = ({ icon, label, onClick, active }) => (
    <div className="flex flex-col items-center gap-2">
        <button onClick={onClick} className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200 ${active ? 'bg-white text-black' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
            <i className={`fas ${icon} text-xl`}></i>
        </button>
        <span className="text-xs font-medium">{label}</span>
    </div>
);

const TranscriptBubble: React.FC<{ entry: TranscriptEntry }> = ({ entry }) => (
    <div className={`flex my-1.5 ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`px-3 py-1.5 rounded-2xl max-w-[85%] shadow-md ${entry.speaker === 'user' ? 'bg-blue-500 rounded-br-lg' : 'bg-zinc-700 rounded-bl-lg'}`}>
           <p className="text-sm leading-relaxed">{entry.text}</p>
        </div>
    </div>
);

export const Dialer: React.FC<{ selectedTemplate: Template; isFocused: boolean; isMobile?: boolean }> = ({ selectedTemplate, isFocused, isMobile = false }) => {
    const [number, setNumber] = useState('');
    const [callState, setCallState] = useState<CallState>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [callDuration, setCallDuration] = useState(0);
    const [showKeypadInCall, setShowKeypadInCall] = useState(false);
    
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const audioPlayerRef = useRef<AudioPlayer | null>(null);

    const { connect, disconnect, isMuted, toggleMute } = useGeminiLive({
        onStateChange: (state) => {
            if (state === 'live') {
                setCallState('live');
                setShowKeypadInCall(false); // Hide keypad when agent connects
            }
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
            const lastEntry = prev[prev.length - 1];
            if (lastEntry && lastEntry.speaker === entry.speaker && entry.speaker !== 'system') {
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
      let interval: ReturnType<typeof setInterval>;
      if (callState === 'live') {
        setCallDuration(0);
        interval = setInterval(() => setCallDuration(d => d + 1), 1000);
      }
      return () => clearInterval(interval);
    }, [callState]);
    
    useEffect(() => {
        if (callState === 'ivr') {
            setShowKeypadInCall(true);
        }
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

    const startCall = async () => {
        if (!number || callState !== 'idle') return;
        
        audioPlayerRef.current = new AudioPlayer();
        setTranscript([]);
        setCallDuration(0);

        setCallState('ringing');
        addTranscript({ speaker: 'system', text: `Calling ${number}...` });

        await new Promise(res => setTimeout(res, 2500));

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
        }, 1500);
    };
    
    const keypadValues: { val: KeypadValue, sub: string }[] = [
        { val: '1', sub: '' }, { val: '2', sub: 'ABC' }, { val: '3', sub: 'DEF' },
        { val: '4', sub: 'GHI' }, { val: '5', sub: 'JKL' }, { val: '6', sub: 'MNO' },
        { val: '7', sub: 'PQRS' }, { val: '8', sub: 'TUV' }, { val: '9', sub: 'WXYZ' },
        { val: '*', sub: '' }, { val: '0', sub: '+' }, { val: '#', sub: '' },
    ];
    
    const isCallActive = callState !== 'idle' && callState !== 'ended' && callState !== 'error';

    return (
        <aside className={`bg-black rounded-[48px] h-full shadow-2xl shadow-black/50 border-[6px] border-zinc-800 flex flex-col overflow-hidden relative ${isMobile ? 'h-full' : 'sticky top-20'}`}>
            {/* iPhone Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-2xl z-10"></div>
            
            <div className={`flex flex-col h-full p-6 pt-12 text-white bg-zinc-900/40 transition-opacity duration-500 ${callState === 'ended' || callState === 'error' ? 'opacity-20' : 'opacity-100'}`}>
                {/* Header */}
                <div className="text-center h-20 flex-shrink-0">
                    <p className="text-xl font-semibold text-zinc-300 transition-opacity duration-300">
                        {isCallActive ? (number || 'Unknown') : selectedTemplate.name}
                    </p>
                    {isCallActive ? (
                         <p className="text-zinc-400 mt-1 capitalize">
                            {callState === 'live' ? formatDuration(callDuration) : callState + '...'}
                         </p>
                    ) : (
                        <input type="text" readOnly value={number} className="bg-transparent text-center text-5xl font-thin tracking-wider w-full outline-none mt-1 h-12" placeholder=""/>
                    )}
                </div>

                {/* Transcript / Main Area */}
                <div className="flex-1 my-2 overflow-hidden relative">
                   {isCallActive && (
                     <div className="absolute inset-0 overflow-y-auto scroll-slim pr-2">
                        {transcript.map((entry, i) => (
                            entry.speaker === 'system' 
                                ? <p key={i} className="text-center text-xs text-zinc-500 my-2">{entry.text}</p>
                                : <TranscriptBubble key={i} entry={entry} />
                        ))}
                        <div ref={transcriptEndRef} />
                    </div>
                   )}
                </div>

                {/* Keypad & Actions */}
                <div className="flex flex-col items-center justify-end gap-4 flex-shrink-0">
                    {isCallActive && !showKeypadInCall && (
                        <div className="w-full max-w-xs grid grid-cols-3 gap-y-4 gap-x-6 mb-2">
                             <ActionButton icon="fa-microphone-slash" label="mute" onClick={toggleMute} active={isMuted} />
                             <ActionButton icon="fa-grip" label="keypad" onClick={() => setShowKeypadInCall(true)} />
                             <ActionButton icon="fa-volume-up" label="speaker" active={true}/>
                             <ActionButton icon="fa-plus" label="add call" />
                             <ActionButton icon="fa-video" label="FaceTime" />
                             <ActionButton icon="fa-address-book" label="contacts" />
                        </div>
                    )}

                    {(callState === 'idle' || showKeypadInCall) && (
                        <>
                         {showKeypadInCall && (
                            <button onClick={() => setShowKeypadInCall(false)} className="text-blue-400 mb-2">Hide</button>
                         )}
                         <div className="grid grid-cols-3 gap-x-4 gap-y-4">
                            {keypadValues.map(k => <KeypadButton key={k.val} value={k.val} subtext={k.sub} onClick={handleKeyPress} />)}
                         </div>
                        </>
                    )}
                    
                    <div className="flex items-center justify-center w-full mt-2">
                        {callState === 'idle' ? (
                            <div className="flex items-center justify-center gap-4 w-full h-[72px]">
                                 <div className="w-[72px]"></div>
                                 <button onClick={startCall} className="w-[72px] h-[72px] rounded-full flex items-center justify-center bg-green-500 hover:bg-green-600 disabled:bg-zinc-600 transition-colors duration-200" disabled={!number}>
                                    <i className="fas fa-phone text-3xl"></i>
                                 </button>
                                 <button onClick={() => handleKeyPress('del')} className="w-[72px] h-[72px] flex items-center justify-center text-2xl text-zinc-400">
                                    {number && <i className="fas fa-delete-left"></i>}
                                 </button>
                            </div>
                        ) : (
                             <button onClick={endCall} className="w-[72px] h-[72px] rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 transition-colors duration-200">
                                <i className="fas fa-phone-slash text-3xl"></i>
                            </button>
                        )}
                    </div>
                </div>
            </div>

             {/* Overlays */}
             {callState === 'ended' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl font-semibold">Call Ended</p>
                </div>
            )}
            {callState === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-xl font-semibold text-red-500">Connection Error</p>
                    <p className="text-sm text-zinc-400 mt-2">Could not connect to the agent. Please check your connection and microphone permissions, then try again.</p>
                </div>
            )}
        </aside>
    );
};
