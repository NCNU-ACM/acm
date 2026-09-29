import Background from '../common/Background';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './JoinSection.module.css';

export default function JoinSection() {
  const { containerRef } = useScrollReveal();

  return (
    <div
      ref={containerRef}
      className={`${styles['join-container']} h-full relative overflow-hidden flex flex-col items-center justify-center px-16 text-center`}
    >
      <Background />
      <div className={styles['glow-bg']}></div>

      <div className="relative z-10">
        <p className={`text-sm tracking-widest mb-2 ${styles['section-label']}`} data-reveal="">
          JOIN US
        </p>
        <h2
          className={`${styles['section-title']} text-5xl md:text-6xl font-bold mb-6`}
          data-reveal=""
          data-reveal-delay="100"
        >
          準備好加入了嗎？
        </h2>
        <p
          className={`text-lg mb-10 max-w-xl mx-auto ${styles['section-subtitle']}`}
          data-reveal=""
          data-reveal-delay="200"
        >
          不論你是程式新手還是經驗豐富的開發者，這裡都有適合你的位置
        </p>

        <div className="flex flex-wrap gap-4 justify-center pt-4" data-reveal="" data-reveal-delay="300">
          <a
            href="/join"
            className={`inline-block px-8 py-4 rounded-full font-medium transition-all hover:scale-105 ${styles['glow-button']}`}
          >
            立即加入 →
          </a>
          <a
            href="/groups/system"
            className={`inline-block px-8 py-4 rounded-full font-medium transition-all hover:scale-105 ${styles['outline-button']}`}
          >
            了解各小組
          </a>
        </div>
      </div>
    </div>
  );
}
