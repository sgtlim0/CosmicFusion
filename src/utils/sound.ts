let audioCtx: AudioContext | null = null

function ctx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function osc(
  c: AudioContext,
  type: OscillatorType,
  freq: number,
  dur: number,
  vol: number,
  delay = 0,
  freqEnd?: number,
) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.connect(g)
  g.connect(c.destination)
  o.type = type
  const t = c.currentTime + delay
  o.frequency.setValueAtTime(freq, t)
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  o.start(t)
  o.stop(t + dur)
}

export function playDrop() {
  const c = ctx()
  osc(c, 'sine', 200, 0.15, 0.25, 0, 80)
}

export function playMerge(level: number) {
  const c = ctx()
  const base = 300 + level * 80
  osc(c, 'sine', base, 0.25, 0.25, 0, base * 2)
  osc(c, 'triangle', base * 2, 0.2, 0.1, 0.05, base * 3)
}

export function playCombo(count: number) {
  const c = ctx()
  const base = 400 + count * 50
  for (let i = 0; i < 3; i++) {
    osc(c, 'sine', base * (1 + i * 0.25), 0.12, 0.12, i * 0.06)
  }
}

export function playBlackHole() {
  const c = ctx()
  osc(c, 'sawtooth', 100, 1, 0.25, 0, 30)
  osc(c, 'sine', 800, 0.8, 0.12, 0, 200)
}

export function playGameOver() {
  const c = ctx()
  const notes = [400, 350, 300, 200]
  for (let i = 0; i < notes.length; i++) {
    osc(c, 'sine', notes[i], 0.3, 0.18, i * 0.2)
  }
}

export function playClick() {
  const c = ctx()
  osc(c, 'sine', 600, 0.08, 0.12)
}
