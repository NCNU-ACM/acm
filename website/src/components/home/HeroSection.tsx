import { useEffect, useRef, useState } from 'react';
import figlet from 'figlet';
import standard from 'figlet/importable-fonts/Standard.js';
import Background from '../common/Background';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './HeroSection.module.css';

// 模組層級：SSR 也會執行，但只註冊字型，不碰 window
figlet.parseFont('Standard', standard);

export default function HeroSection() {
  const { containerRef } = useScrollReveal();

  const [isHovered, setIsHovered] = useState(false);
  // SSR 與 hydrate 時為空字串，掛載後才填入，避免伺服器與瀏覽器輸出不一致
  const [asciiArt, setAsciiArt] = useState('');
  const [inputText, setInputText] = useState('');
  const composing = useRef(false);

  const renderAscii = (text: string) => {
    figlet.text(text, { font: 'Standard' }, (err, result) => {
      if (!err && result) {
        setAsciiArt(result);
      }
    });
  };

  const updateAscii = (value: string) => {
    const text = value.trim() || 'NCNU ACM';
    renderAscii(text);
  };

  useEffect(() => {
    renderAscii('NCNU ACM');
  }, []);

  // 輸入法組字期間（compositionstart → compositionend）不更新 inputText，等組字結束才用最終文字更新並重畫 ASCII，
  // 否則注音／拼音組字中的中間字母會被拿去畫 ASCII，且組字第一個字時 placeholder 會提早消失。
  // 因此 <input> 維持非受控（defaultValue），只由這個函式把值單向寫進 state。
  const commit = (value: string) => {
    setInputText(value);
    updateAscii(value);
  };

  return (
    <div
      ref={containerRef}
      className={`${styles['hero-container']} flex flex-col h-full relative overflow-hidden`}
    >
      <Background />
      <div className="flex flex-col items-center justify-center flex-1 relative z-10 text-center px-8">
        <div className={styles['title-wrapper']} data-reveal="">
          <pre className={styles['ascii-bg']}>{asciiArt}</pre>
          <h1
            className={`text-7xl md:text-8xl lg:text-9xl font-bold mb-4 tracking-tight relative z-10 ${styles['hero-title']}`}
          >
            NCNU ACM
          </h1>
        </div>

        <div className="mb-6" data-reveal="" data-reveal-delay="150">
          <p className={`text-3xl md:text-4xl lg:text-5xl ${styles['gradient-text']} font-bold`}>
            程式設計 × 系統開發 × 創意實踐
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center mt-6" data-reveal="" data-reveal-delay="300">
          <a
            href="/join"
            className={`inline-block px-8 py-4 rounded-full font-medium transition-all hover:scale-105 ${styles['glow-button']}`}
          >
            加入我們 →
          </a>
          <a
            href="/events"
            className={`inline-block px-8 py-4 rounded-full font-medium transition-all hover:scale-105 ${styles['outline-button']}`}
          >
            活動公告
          </a>
          <a
            href="/about/introduction"
            className={`inline-block px-8 py-4 rounded-full font-medium transition-all hover:scale-105 ${styles['outline-button']}`}
          >
            關於我們
          </a>
        </div>

        <div
          className={`${styles['terminal-input-bar']} mt-8`}
          data-reveal=""
          data-reveal-delay="450"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {!inputText && (
            <span className={`${styles['placeholder-text']}${isHovered ? ` ${styles.active}` : ''}`}>NCNU ACM</span>
          )}
          <input
            type="text"
            className={`${styles['terminal-input']}${isHovered ? ` ${styles.active}` : ''}`}
            defaultValue=""
            maxLength={12}
            onInput={(e) => {
              if (composing.current) return;
              commit(e.currentTarget.value);
            }}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={(e) => {
              composing.current = false;
              commit(e.currentTarget.value);
            }}
          />
          <span className={`${styles.cursor}${isHovered ? ` ${styles.active}` : ''}`}>_</span>
        </div>
      </div>
    </div>
  );
}
