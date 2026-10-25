// Original, synthesized retro sound effects (Web Audio API); no audio files are used.

export type ArcadeCue = "activated" | "finish-it" | "fatality" | "victory";

export interface ArcadeSound {
  play(cue: ArcadeCue): void;
  setMuted(muted: boolean): void;
  /** Silences anything still scheduled or speaking. */
  stop(): void;
  dispose(): void;
}

const MASTER_VOLUME = 0.16;

/** Returns null when the browser has no Web Audio support; the Easter egg then runs silently. */
export function createArcadeSound(): ArcadeSound | null {
  if (typeof window === "undefined" || typeof window.AudioContext !== "function") {
    return null;
  }

  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = MASTER_VOLUME;
  master.connect(context.destination);
  // Each run plays through its own bus, so stop() can silence sounds that are already scheduled.
  const createBus = () => {
    const gain = context.createGain();
    gain.connect(master);
    return gain;
  };
  let bus = createBus();
  let muted = false;
  const pendingTimeouts = new Set<number>();

  const tone = (
    frequency: number,
    start: number,
    duration: number,
    type: OscillatorType = "square",
    endFrequency?: number,
    volume = 0.6
  ) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const at = context.currentTime + start;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, at + duration);
    }
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    oscillator.connect(gain).connect(bus);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
  };

  const noise = (start: number, duration: number, volume = 0.7) => {
    const length = Math.floor(context.sampleRate * duration);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    const at = context.currentTime + start;
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, at);
    source.connect(gain).connect(bus);
    source.start(at);
  };

  const announce = (text: string) => {
    if (!("speechSynthesis" in window)) {
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.pitch = 0.2;
    utterance.rate = 0.72;
    utterance.volume = 0.8;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const cues: Record<ArcadeCue, () => void> = {
    activated: () => {
      [523, 659, 784, 1047].forEach((frequency, index) => tone(frequency, index * 0.07, 0.09));
    },
    "finish-it": () => {
      tone(220, 0.1, 0.5, "sawtooth", 55, 0.5);
      noise(0.1, 0.25, 0.35);
    },
    fatality: () => {
      tone(1400, 0, 0.45, "square", 300, 0.25);
      noise(0.45, 0.5, 0.9);
      tone(120, 0.45, 0.6, "sine", 40, 0.9);
    },
    victory: () => {
      [392, 523, 659, 784].forEach((frequency, index) => tone(frequency, index * 0.11, 0.14));
      tone(1047, 0.48, 0.5, "square", undefined, 0.5);
      const timeout = window.setTimeout(() => {
        pendingTimeouts.delete(timeout);
        if (!muted) {
          announce("Unsubscribality!");
        }
      }, 450);
      pendingTimeouts.add(timeout);
    },
  };

  return {
    play(cue) {
      if (muted) {
        return;
      }
      void context.resume();
      cues[cue]();
    },
    setMuted(value) {
      muted = value;
      master.gain.setValueAtTime(value ? 0 : MASTER_VOLUME, context.currentTime);
      if (value && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    },
    stop() {
      pendingTimeouts.forEach((timeout) => window.clearTimeout(timeout));
      pendingTimeouts.clear();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      bus.disconnect();
      bus = createBus();
    },
    dispose() {
      this.stop();
      void context.close();
    },
  };
}
