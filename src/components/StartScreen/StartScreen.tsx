import { useCallback } from 'react'
import { playClick } from '../../utils/sound'
import { PLANETS } from '../../game/constants'
import styles from './StartScreen.module.css'

interface Props {
  highScore: number
  onStart: () => void
}

export default function StartScreen({ highScore, onStart }: Props) {
  const handleStart = useCallback(() => {
    playClick()
    onStart()
  }, [onStart])

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Cosmic Fusion</h1>
      <p className={styles.subtitle}>Merge planets, create a Black Hole!</p>

      {highScore > 0 && (
        <p className={styles.highScore}>Best: {highScore.toLocaleString()}</p>
      )}

      <div className={styles.planets}>
        {PLANETS.map((p, i) => (
          <div key={p.name} className={styles.planetRow}>
            <span
              className={styles.dot}
              style={{ background: p.color, width: 10 + i * 3, height: 10 + i * 3 }}
            />
            <span className={styles.planetName}>{p.name}</span>
            {i < PLANETS.length - 1 && <span className={styles.arrow}>&rarr;</span>}
          </div>
        ))}
      </div>

      <button className={styles.playBtn} onClick={handleStart}>
        PLAY
      </button>

      <p className={styles.controls}>
        Move to aim &middot; Tap to drop<br />
        Same planets merge into bigger ones!
      </p>
    </div>
  )
}
