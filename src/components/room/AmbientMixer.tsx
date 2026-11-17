import { useEffect, useRef, useState } from 'react';
import { CloudRain, Coffee, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type AmbientKind = 'rain' | 'cafe';

/**
 * Tiny procedural ambience generator: filtered noise loops, no audio files.
 * Rain is bright noise under a low-pass filter; café hum is slow brown noise.
 */
class AmbientEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private channels = new Map<AmbientKind, { gain: GainNode; source: AudioBufferSourceNode }>();
  private volume = 0.4;

  private ensure(): boolean {
    if (typeof window === 'undefined') return false;
    if (!this.context) {
      const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return false;
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return true;
  }

  private buildChannel(kind: AmbientKind) {
    if (!this.context || !this.master || this.channels.has(kind)) return;

    const length = this.context.sampleRate * 2;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      if (kind === 'rain') {
        data[index] = white * 0.5;
      } else {
        last = (last + 0.02 * white) / 1.02;
        data[index] = last * 3.5;
      }
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = kind === 'rain' ? 1100 : 240;

    const gain = this.context.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start();

    this.channels.set(kind, { gain, source });
  }

  setEnabled(kind: AmbientKind, enabled: boolean) {
    if (!this.ensure()) return;
    this.buildChannel(kind);
    const channel = this.channels.get(kind);
    if (!channel || !this.context) return;
    const now = this.context.currentTime;
    channel.gain.gain.cancelScheduledValues(now);
    channel.gain.gain.setValueAtTime(channel.gain.gain.value, now);
    channel.gain.gain.linearRampToValueAtTime(enabled ? 1 : 0, now + 0.4);
  }

  setVolume(volume: number) {
    this.volume = volume;
    if (this.master && this.context) {
      this.master.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.1);
    }
  }

  stopAll() {
    for (const [kind] of this.channels) this.setEnabled(kind, false);
  }
}

const ambientEngine = new AmbientEngine();
const STORAGE_KEY = 'cornermug.ambient';

interface StoredMixerState {
  rain: boolean;
  cafe: boolean;
  volume: number;
}

function readStored(): StoredMixerState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredMixerState>;
      return {
        rain: Boolean(parsed.rain),
        cafe: Boolean(parsed.cafe),
        volume: typeof parsed.volume === 'number' ? parsed.volume : 0.4,
      };
    }
  } catch {
    // Ignore storage failures.
  }
  return { rain: false, cafe: false, volume: 0.4 };
}

export function AmbientMixer() {
  const initial = useRef<StoredMixerState>(readStored());
  const [rain, setRain] = useState(initial.current.rain);
  const [cafe, setCafe] = useState(initial.current.cafe);
  const [volume, setVolume] = useState(initial.current.volume);

  useEffect(() => {
    ambientEngine.setVolume(initial.current.volume);
    if (initial.current.rain) ambientEngine.setEnabled('rain', true);
    if (initial.current.cafe) ambientEngine.setEnabled('cafe', true);
    return () => ambientEngine.stopAll();
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ rain, cafe, volume }));
    } catch {
      // Ignore storage failures.
    }
  }, [rain, cafe, volume]);

  const toggleKind = (kind: AmbientKind) => {
    const next = kind === 'rain' ? !rain : !cafe;
    if (kind === 'rain') setRain(next);
    else setCafe(next);
    ambientEngine.setEnabled(kind, next);
  };

  return (
    <div className="pointer-events-auto w-64 rounded-2xl border border-charcoal/10 bg-white/85 p-4 shadow-card backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">Ambience</p>
        {volume > 0 ? <Volume2 className="h-4 w-4 text-charcoal/50" /> : <VolumeX className="h-4 w-4 text-charcoal/40" />}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant={rain ? 'secondary' : 'outline'} size="sm" onClick={() => toggleKind('rain')}>
          <CloudRain className="h-3.5 w-3.5" /> Rain
        </Button>
        <Button variant={cafe ? 'secondary' : 'outline'} size="sm" onClick={() => toggleKind('cafe')}>
          <Coffee className="h-3.5 w-3.5" /> Café
        </Button>
      </div>

      <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-charcoal/50">
        Volume
      </label>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(event) => {
          const next = Number(event.target.value);
          setVolume(next);
          ambientEngine.setVolume(next);
        }}
        className="mt-1 w-full accent-lavender-deep"
      />
    </div>
  );
}
