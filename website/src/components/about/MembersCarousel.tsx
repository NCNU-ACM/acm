import { useState, type CSSProperties } from 'react';
import type { GroupRef, Member } from '../../types/content';
import styles from './MembersCarousel.module.css';

interface Props {
  members: Member[];
  semesters: string[];
  // 沒有任何成員資料時 index.astro 傳進來的是 undefined
  latestSemester?: string;
  groups: GroupRef[];
}

export default function MembersCarousel({ members, semesters, latestSemester, groups }: Props) {
  const [currentSemester, setCurrentSemester] = useState(latestSemester);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredMembers = members.filter((m) => m.semester === currentSemester);
  const len = filteredMembers.length;

  const groupLabel = (slug: string) => {
    const g = groups.find((g) => g.slug === slug);
    return g ? g.name : slug;
  };

  const avatarUrl = (member: Member) => {
    if (member.avatar) return member.avatar;
    return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(member.name)}`;
  };

  const prev = () => setCurrentIndex((currentIndex - 1 + len) % len);
  const next = () => setCurrentIndex((currentIndex + 1) % len);

  const getOffset = (index: number) => {
    let offset = index - currentIndex;
    if (offset > len / 2) offset -= len;
    if (offset < -len / 2) offset += len;
    return offset;
  };

  // is-prev / is-next / is-prev-2 / is-next-2 在 CSS 裡沒有規則（只有位置標記），
  // 沒有規則就不會出現在 styles 內，所以要濾掉 undefined
  const cardClass = (index: number) => {
    const offset = getOffset(index);
    let position = 'is-hidden';
    if (offset === 0) position = 'is-active';
    else if (offset === -1) position = 'is-prev';
    else if (offset === 1) position = 'is-next';
    else if (offset === -2) position = 'is-prev-2';
    else if (offset === 2) position = 'is-next-2';
    return [styles['member-card'], styles[position]].filter(Boolean).join(' ');
  };

  const cardStyle = (index: number): CSSProperties => {
    const offset = getOffset(index);
    const absOffset = Math.abs(offset);
    const direction = offset === 0 ? 0 : offset / absOffset;

    const baseGap = 220;
    const shrinkFactor = 0.7;

    let translateDistance = 0;
    let gap = baseGap;
    for (let i = 0; i < absOffset; i++) {
      translateDistance += gap;
      gap *= shrinkFactor * shrinkFactor;
    }
    const translateX = direction * translateDistance;
    let scale = 1;
    let opacity = 1;
    const zIndex = 10 - Math.abs(offset);

    if (absOffset === 0) {
      scale = 1;
      opacity = 1;
    } else {
      const scaleShrink = 0.1;
      const opacityShrink = 0.25;
      scale = Math.max(0.4, 1 - absOffset * scaleShrink);
      opacity = Math.max(0, 1 - absOffset * opacityShrink);
    }

    return {
      transform: `translateX(${translateX}px) scale(${scale})`,
      opacity,
      zIndex,
    };
  };

  // 點擊側邊卡片一定是切到該卡片自己的 index（offset 只是 index - currentIndex 加減一圈），
  // 直接設定即可，不必逐步呼叫 prev / next（React 的 state 在同一個 handler 內不會即時更新）。
  const handleCardClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={styles['carousel-section']}>
      <div className={styles.filter}>
        <label>選擇學期：</label>
        <select
          value={currentSemester ?? ''}
          onChange={(e) => {
            setCurrentSemester(e.target.value);
            setCurrentIndex(0);
          }}
        >
          {semesters.map((sem) => (
            <option key={sem} value={sem}>{sem}</option>
          ))}
        </select>
      </div>

      {len === 0 ? (
        <div className={styles.empty}>
          這個學期目前沒有幹部資料
        </div>
      ) : (
        <div className={styles.stage}>
          <button className={`${styles['nav-btn']} ${styles.left}`} onClick={prev}>‹</button>

          <div className={styles['cards-track']}>
            {filteredMembers.map((member, index) => (
              <div
                key={member.id}
                className={cardClass(index)}
                style={cardStyle(index)}
                onClick={() => handleCardClick(index)}
              >
                <div className={styles['card-left']}>
                  <img src={avatarUrl(member)} className={styles['avatar-image']} alt={member.name} />
                  <h3 className={styles['member-name']}>{member.name}</h3>
                </div>
                <div className={styles['card-right']}>
                  <p className={styles['member-role']}>
                    {/* 組別與職稱在同一行文字流內相鄰，中間不加空格，顯示為「系統組組長」 */}
                    {member.group && <span>{groupLabel(member.group)}</span>}{member.role}
                  </p>
                  {member.bio && <p className={styles['member-bio']}>{member.bio}</p>}
                  {member.contact && member.contact.length > 0 && (
                    <div className={styles['contact-list']}>
                      {member.contact.map((c) => (
                        <a
                          key={c.label}
                          href={c.url}
                          target="_blank"
                          className={styles['contact-link']}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button className={`${styles['nav-btn']} ${styles.right}`} onClick={next}>›</button>
        </div>
      )}

      {len > 0 && (
        <div className={styles.counter}>
          {`${currentIndex + 1} / ${len}`}
        </div>
      )}
    </div>
  );
}
