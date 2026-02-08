import { useCosmicFusion } from './hooks/useCosmicFusion'
import StartScreen from './components/StartScreen/StartScreen'
import GameOver from './components/GameOver/GameOver'
import styles from './App.module.css'

export default function App() {
  const {
    canvasRef, wrapperRef, phase, score, highScore,
    startGame, goToMenu,
  } = useCosmicFusion()

  return (
    <div className={styles.container}>
      {phase === 'menu' && (
        <StartScreen highScore={highScore} onStart={startGame} />
      )}

      {(phase === 'playing' || phase === 'gameOver') && (
        <div ref={wrapperRef} className={styles.canvasWrapper}>
          <canvas ref={canvasRef} className={styles.canvas} />
          {phase === 'gameOver' && (
            <GameOver
              score={score}
              highScore={highScore}
              onRetry={startGame}
              onMenu={goToMenu}
            />
          )}
        </div>
      )}
    </div>
  )
}
