export type GamePhase = 'menu' | 'playing' | 'gameOver'

export interface PlanetDef {
  readonly name: string
  readonly radius: number
  readonly color: string
  readonly glowColor: string
  readonly score: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface MergeEffect {
  x: number
  y: number
  radius: number
  maxRadius: number
  life: number
  color: string
  glowColor: string
}

export interface FloatingText {
  x: number
  y: number
  text: string
  life: number
  color: string
}

export interface Star {
  x: number
  y: number
  size: number
  brightness: number
  twinkleSpeed: number
}
