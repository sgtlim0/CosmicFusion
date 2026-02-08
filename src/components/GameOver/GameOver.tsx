import { useCallback } from 'react'
import { playClick } from '../../utils/sound'
import styles from './GameOver.module.css'

interface Props {
  score: number
  highScore: number
  onRetry: () => void
  onMenu: () => void
}

export default function GameOver({ score, highScore, onRetry, onMenu }: Props) {
  const handleRetry = useCallback(() => { playClick(); onRetry() }, [onRetry])
  const handleMenu = useCallback(() => { playClick(); onMenu() }, [onMenu])

  const isNew = score >= highScore && score > 0

  return (
    <div className={styles.overlay}>
      <h2 className={styles.title}>Game Over</h2>

      {isNew && <p className={styles.newRecord}>New Record!</p>}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{score.toLocaleString()}</div>
          <div className={styles.statLabel}>Score</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{highScore.toLocaleString()}</div>
          <div className={styles.statLabel}>Best</div>
        </div>
      </div>

      <div className={styles.buttons}>
        <button className={styles.retryBtn} onClick={handleRetry}>Retry</button>
        <button className={styles.menuBtn} onClick={handleMenu}>Menu</button>
      </div>
    </div>
  )
}
