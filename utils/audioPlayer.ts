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
    private currentIVRSource: AudioBufferSourceNode | null = null;

    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: OUTPUT_SAMPLE_RATE,
        });
        this.audioContext.suspend();
    }

    /**
     * Decodes a base64 audio chunk and adds it to the playback queue.
     * @param base64Audio The base64 encoded string of raw PCM audio data.
     */
    public async addChunk(base64Audio: string) {
        if (this.audioContext.state === 'closed') return;
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
     * @param onEndCallback A callback function to execute when the audio finishes playing naturally.
     */
    public playBase64(base64Audio: string, onEndCallback: () => void) {
        decodeAudioData(decode(base64Audio), this.audioContext, OUTPUT_SAMPLE_RATE, NUM_CHANNELS)
            .then(audioBuffer => {
                if (this.audioContext.state === 'closed') return;
                
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                this.interruptIVR(); // Stop any currently playing IVR

                const source = this.audioContext.createBufferSource();
                this.currentIVRSource = source;
                source.buffer = audioBuffer;
                source.connect(this.audioContext.destination);
                source.onended = () => {
                    // Only trigger callback if this source is the one that ended, not an interrupted one.
                    if (this.currentIVRSource === source) {
                        this.currentIVRSource = null;
                        onEndCallback();
                    }
                };
                source.start();
            })
            .catch(err => {
                console.error("Failed to decode and play base64 audio:", err);
                onEndCallback(); // Proceed even if audio fails
            });
    }

    /**
     * Stops the currently playing IVR audio track immediately.
     */
    public interruptIVR() {
        if (this.currentIVRSource) {
            this.currentIVRSource.onended = null; // Prevent the 'onended' callback from firing
            this.currentIVRSource.stop();
            this.currentIVRSource = null;
        }
    }

    /**
     * Processes and plays the audio buffers in the queue recursively.
     */
    private playQueue() {
        if (this.audioQueue.length === 0 || this.audioContext.state === 'closed') {
            this.isPlaying = false;
            return;
        }

        this.isPlaying = true;
        const buffer = this.audioQueue.shift()!;

        // Ensure we don't schedule audio in the past.
        const currentTime = this.audioContext.currentTime;
        const scheduledTime = this.nextStartTime < currentTime ? currentTime : this.nextStartTime;

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(scheduledTime);

        // Update the start time for the next audio chunk.
        this.nextStartTime = scheduledTime + buffer.duration;

        source.onended = () => {
            // When this chunk finishes, play the next one in the queue.
            this.playQueue();
        };
    }

    /**
     * Stops all queued and playing audio immediately and closes the audio context.
     */
    public stop() {
        this.interruptIVR();
        this.audioQueue = []; // Clear the agent audio queue
        this.isPlaying = false;
        if (this.audioContext.state !== 'closed') {
           this.audioContext.close().catch(console.error);
        }
    }
}
