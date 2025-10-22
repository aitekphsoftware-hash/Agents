export type View = 'projects' | 'agents' | 'knowledge' | 'models' | 'voices';

export interface Template {
  id: string;
  icon: string;
  name: string;
  description: string;
  voiceLang: string;
  greeting: string;
  systemInstruction: string;
}

export type CallState = 'idle' | 'ringing' | 'ivr' | 'connecting' | 'live' | 'ended' | 'error';

export interface TranscriptEntry {
  speaker: 'user' | 'agent' | 'system';
  text: string;
}

export type KeypadValue = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '*' | '0' | '#';
