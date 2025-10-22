import { decode, decodeAudioData } from './audioUtils';

const OUTPUT_SAMPLE_RATE = 24000;
const NUM_CHANNELS = 1;

/**
 * Manages the playback of a continuous stream of audio chunks.
 * This class ensures that audio buffers are played back-to-back without gaps,
 * creating a smooth, uninterrupted audio experience for the agent's voice.
 */
export class AudioPlayer {
    private audioContext: AudioContext;
    private audioQueue: AudioBuffer[] = [];
    private isPlaying = false;
    private nextStartTime = 0;

    constructor() {
        // FIX: Cast window to any to access vendor-prefixed webkitAudioContext.
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: OUTPUT_SAMPLE_RATE,
        });
        // Start with a suspended context that resumes on the first audio chunk.
        this.audioContext.suspend();
    }

    /**
     * Decodes a base64 audio chunk and adds it to the playback queue.
     * @param base64Audio The base64 encoded string of raw PCM audio data.
     */
    public async addChunk(base64Audio: string) {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        const rawAudio = decode(base64Audio);
        const audioBuffer = await decodeAudioData(rawAudio, this.audioContext, OUTPUT_SAMPLE_RATE, NUM_CHANNELS);
        this.audioQueue.push(audioBuffer);
        if (!this.isPlaying) {
            this.playQueue();
        }
    }

    /**
     * Plays an entire base64 audio file from start to finish. Useful for pre-generated audio like IVR.
     * @param base64Audio The base64 encoded string of the audio.
     * @returns A promise that resolves when playback is finished.
     */
    public playBase64(base64Audio: string): Promise<void> {
        return new Promise(async (resolve) => {
             if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            const rawAudio = decode(base64Audio);
            const audioBuffer = await decodeAudioData(rawAudio, this.audioContext, OUTPUT_SAMPLE_RATE, NUM_CHANNELS);
            
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);
            source.onended = () => resolve();
            source.start();
        });
    }

    /**
     * Processes and plays the audio buffers in the queue.
     */
    private playQueue() {
        if (this.audioQueue.length === 0) {
            this.isPlaying = false;
            return;