import type { PlanetDef } from './types'

export const GAME_WIDTH = 380
export const GAME_HEIGHT = 650
export const LIMIT_Y = 90
export const DROP_COOLDOWN = 500
export const GAME_OVER_FRAMES = 120
export const HIGH_SCORE_KEY = 'cosmicFusion_highScore'

export const PLANETS: readonly PlanetDef[] = [
  { name: 'Dust',      radius: 14, color: '#99aacc', glowColor: 'rgba(153,170,204,0.4)', score: 10 },
  { name: 'Asteroid',  radius: 20, color: '#cc8844', glowColor: 'rgba(204,136,68,0.4)',  score: 30 },
  { name: 'Moon',      radius: 28, color: '#dde4f0', glowColor: 'rgba(221,228,240,0.4)', score: 60 },
  { name: 'Mars',      radius: 38, color: '#ff4433', glowColor: 'rgba(255,68,51,0.4)',   score: 100 },
  { name: 'Earth',     radius: 50, color: '#33aaff', glowColor: 'rgba(51,170,255,0.4)',  score: 200 },
  { name: 'Jupiter',   radius: 64, color: '#ff9933', glowColor: 'rgba(255,153,51,0.4)',  score: 400 },
  { name: 'Sun',       radius: 80, color: '#ffdd00', glowColor: 'rgba(255,221,0,0.4)',   score: 800 },
  { name: 'BlackHole', radius: 98, color: '#aa33ff', glowColor: 'rgba(170,51,255,0.6)',  score: 2000 },
] as const

export const DROP_TYPES = [0, 1, 2] as const

export const GRAVITY_CONSTANT = 0.0004
export const ATTRACTION_RANGE = 200
