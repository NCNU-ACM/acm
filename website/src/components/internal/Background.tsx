import CodeRain from './CodeRain';
import styles from './Background.module.css';

export default function Background() {
  return (
    <div className={styles['hero-bg-wrapper']}>
      <div className={styles['circuit-bg']}></div>

      <div className={styles['code-rain-wrapper']}>
        <CodeRain />
      </div>

      <svg
        className={`${styles['circuit-deco']} ${styles['circuit-bottom-left']}`}
        viewBox="0 0 300 300"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" stroke="rgba(59,130,246,0.45)" strokeWidth="2">
          <path d="M10 290 L10 220 L70 220 L70 160 L130 160" />
          <path d="M10 290 L90 290 L90 240 L160 240" />
          <path d="M40 290 L40 250 L20 250" />
          <path d="M10 260 L50 260" />
          <path d="M70 220 L70 190 L100 190" />
          <path d="M130 160 L130 120 L180 120" />
          <path d="M160 240 L160 200 L200 200" />
          <path d="M90 290 L130 290 L130 270" />
          <circle cx="130" cy="160" r="5" fill="rgba(52,211,153,0.8)" />
          <circle cx="160" cy="240" r="5" fill="rgba(52,211,153,0.8)" />
          <circle cx="180" cy="120" r="4" fill="rgba(52,211,153,0.7)" />
          <circle cx="200" cy="200" r="4" fill="rgba(52,211,153,0.7)" />
          <circle cx="70" cy="220" r="4" fill="rgba(59,130,246,0.65)" />
          <circle cx="20" cy="250" r="3" fill="rgba(59,130,246,0.6)" />
          <circle cx="100" cy="190" r="3" fill="rgba(59,130,246,0.6)" />
          <circle cx="130" cy="270" r="3" fill="rgba(59,130,246,0.6)" />
          <rect x="120" y="150" width="22" height="22" rx="3" />
          <rect x="150" y="230" width="22" height="22" rx="3" />
        </g>
      </svg>

      <svg
        className={`${styles['circuit-deco']} ${styles['circuit-top-right']}`}
        viewBox="0 0 300 300"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" stroke="rgba(59,130,246,0.45)" strokeWidth="2">
          <path d="M290 10 L290 80 L230 80 L230 140 L170 140" />
          <path d="M290 10 L210 10 L210 60 L140 60" />
          <path d="M260 10 L260 50 L280 50" />
          <path d="M290 40 L250 40" />
          <path d="M230 80 L230 110 L200 110" />
          <path d="M170 140 L170 180 L120 180" />
          <path d="M140 60 L140 100 L100 100" />
          <path d="M210 10 L170 10 L170 30" />
          <circle cx="170" cy="140" r="5" fill="rgba(52,211,153,0.8)" />
          <circle cx="140" cy="60" r="5" fill="rgba(52,211,153,0.8)" />
          <circle cx="120" cy="180" r="4" fill="rgba(52,211,153,0.7)" />
          <circle cx="100" cy="100" r="4" fill="rgba(52,211,153,0.7)" />
          <circle cx="230" cy="80" r="4" fill="rgba(59,130,246,0.65)" />
          <circle cx="280" cy="50" r="3" fill="rgba(59,130,246,0.6)" />
          <circle cx="200" cy="110" r="3" fill="rgba(59,130,246,0.6)" />
          <circle cx="170" cy="30" r="3" fill="rgba(59,130,246,0.6)" />
          <rect x="158" y="129" width="22" height="22" rx="3" />
          <rect x="128" y="49" width="22" height="22" rx="3" />
        </g>
      </svg>
    </div>
  );
}
