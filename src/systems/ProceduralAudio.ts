import type { SoundSettings } from "../domain/campaign/CampaignProfile";

export type SoundCue = "button" | "attack" | "damage" | "pickup" | "upgrade" | "win" | "loss" | "freeze" | "thaw";

export class ProceduralAudio {
  private context?: AudioContext;
  constructor(private settings: SoundSettings) {}

  setSettings(settings: SoundSettings): void { this.settings = settings; }
  play(cue: SoundCue): void {
    if (this.settings.muted || this.settings.volume <= 0 || typeof window === "undefined") return;
    this.context ??= new AudioContext();
    const context = this.context;
    if (context.state === "suspended") void context.resume();
    const now = context.currentTime;
    const frequencies: Record<SoundCue, number> = { button: 330, attack: 150, damage: 90, pickup: 620, upgrade: 760, win: 880, loss: 100, freeze: 240, thaw: 540 };
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = cue === "damage" || cue === "loss" ? "sawtooth" : "square";
    oscillator.frequency.setValueAtTime(frequencies[cue], now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(55, frequencies[cue] * (cue === "win" || cue === "thaw" ? 1.7 : 0.72)), now + 0.12);
    gain.gain.setValueAtTime(this.settings.volume * 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now); oscillator.stop(now + 0.15);
  }
}

export const gameAudio = new ProceduralAudio({ muted: false, volume: 0.55 });
