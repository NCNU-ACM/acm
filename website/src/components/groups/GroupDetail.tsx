import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EventItem, Group, GroupMember, ShowcaseCard, ShowcaseItem } from '../../types/content';
import EventListPanel from '../common/EventListPanel';
import ShowcaseModal from '../common/ShowcaseModal';
import SlideTransition from '../common/SlideTransition';
import styles from './GroupDetail.module.css';

interface Props {
  group: Group;
  members: GroupMember[];
  events: EventItem[];
  showcase: ShowcaseCard[];
  showcaseItems: ShowcaseItem[];
}

const avatarUrl = (member: GroupMember) => {
  if (member.avatar) return member.avatar;
  return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(member.name)}`;
};

export default function GroupDetail({ group, members, events, showcase, showcaseItems }: Props) {
  const groupsForModal = useMemo(() => [{ slug: group.slug, name: group.name }], [group.slug, group.name]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentMember = members[currentIndex];

  const prev = () => setCurrentIndex((i) => (i - 1 + members.length) % members.length);
  const next = () => setCurrentIndex((i) => (i + 1) % members.length);

  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [selectedShowcase, setSelectedShowcase] = useState<ShowcaseCard | null>(null);

  // 計時器與「modal 是否開著」不驅動畫面，放 ref：setInterval 與 mouseleave 讀到的永遠是最新值
  const carouselTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isModalOpen = useRef(false);

  const showcaseNext = useCallback(() => {
    setSlideDirection('left');
    setShowcaseIndex((i) => (i + 1) % showcase.length);
  }, [showcase.length]);

  const showcasePrev = () => {
    setSlideDirection('right');
    setShowcaseIndex((i) => (i - 1 + showcase.length) % showcase.length);
  };

  const showcaseGoTo = (i: number) => {
    setSlideDirection(i > showcaseIndex ? 'left' : 'right');
    setShowcaseIndex(i);
  };

  const startCarousel = useCallback(() => {
    if (carouselTimer.current) return;
    carouselTimer.current = setInterval(showcaseNext, 4000);
  }, [showcaseNext]);

  const pauseCarousel = useCallback(() => {
    if (carouselTimer.current) {
      clearInterval(carouselTimer.current);
      carouselTimer.current = null;
    }
  }, []);

  const resumeCarousel = useCallback(() => {
    if (isModalOpen.current) return;
    startCarousel();
  }, [startCarousel]);

  useEffect(() => {
    if (showcase.length > 1) startCarousel();
    return pauseCarousel;
  }, []);

  // 點擊時開的是「當下」顯示的那一張：轉場中離場的舊 slide 被點到時，開的也是目前這張，而不是被點到的舊 slide
  const showcaseIndexRef = useRef(showcaseIndex);
  showcaseIndexRef.current = showcaseIndex;

  const openShowcaseModal = useCallback(
    (item: ShowcaseCard) => {
      setSelectedShowcase(item);
      isModalOpen.current = true;
      pauseCarousel();
    },
    [pauseCarousel],
  );
  const openCurrentShowcase = useCallback(
    () => openShowcaseModal(showcase[showcaseIndexRef.current]),
    [openShowcaseModal, showcase],
  );

  const closeShowcaseModal = () => {
    setSelectedShowcase(null);
    isModalOpen.current = false;
    if (showcase.length > 1) startCarousel();
  };

  const currentShowcase = showcase[showcaseIndex];

  return (
    <div className={styles['group-detail']}>
      <div className={styles['top-section']}>
        <div className={styles['intro-area']}>
          <div className={styles['group-color-bar']} style={{ background: group.color }}></div>
          <p className={styles['section-label']}>GROUP</p>
          <h1 className={styles['group-title']} style={{ color: group.color }}>
            {group.name}
          </h1>
          <p className={styles['group-tagline']}>{group.tagline}</p>
          <p className={styles['group-description']}>{group.description}</p>
        </div>

        <div className={styles['members-area']}>
          <h2 className={styles['block-title']}>目前幹部</h2>
          {members.length === 0 ? (
            <div className={styles.empty}>目前沒有幹部資料</div>
          ) : (
            <div className={styles['member-carousel']}>
              <button className={styles['nav-btn']} onClick={prev}>
                ‹
              </button>
              <div className={styles['member-card']}>
                <div className={styles['card-left']}>
                  <img src={avatarUrl(currentMember)} className={styles['member-avatar']} alt={currentMember.name} />
                  <p className={styles['member-name']}>{currentMember.name}</p>
                </div>
                <div className={styles['card-right']}>
                  <p className={styles['member-role']}>{currentMember.role}</p>
                  {currentMember.bio && <p className={styles['member-bio']}>{currentMember.bio}</p>}
                  {currentMember.contact && currentMember.contact.length > 0 && (
                    <div className={styles['contact-list']}>
                      {currentMember.contact.map((c) => (
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
              <button className={styles['nav-btn']} onClick={next}>
                ›
              </button>
            </div>
          )}
          {members.length > 1 && (
            <div className={styles['member-counter']}>{`${currentIndex + 1} / ${members.length}`}</div>
          )}
        </div>
      </div>

      <div className={styles['section-block']}>
        <h2 className={styles['block-title']}>小組公告</h2>
        <EventListPanel
          events={events}
          groups={groupsForModal}
          showcaseItems={showcaseItems}
          pageSize={5}
          maxHeight="360px"
          showGroup={false}
        />
      </div>

      <div className={styles['section-block']}>
        <h2 className={styles['block-title']}>成果展示</h2>
        {showcase.length === 0 ? (
          <div className={styles.empty}>目前沒有成果展示資料</div>
        ) : (
          <div className={styles['showcase-carousel']}>
            <button className={`${styles['carousel-nav']} ${styles.left}`} onClick={showcasePrev}>
              ‹
            </button>

            <div className={styles['slide-container']}>
              {/* SlideTransition 直接改這個元素的 classList，所以它的 className 不能是動態的 */}
              <SlideTransition name={slideDirection === 'left' ? 'slide-left' : 'slide-right'} styles={styles}>
                <div
                  key={showcaseIndex}
                  className={styles['showcase-slide']}
                  onMouseEnter={pauseCarousel}
                  onMouseLeave={resumeCarousel}
                  onClick={openCurrentShowcase}
                >
                  <div className={styles['showcase-cover']}>
                    {currentShowcase.cover_image ? (
                      <img src={currentShowcase.cover_image} className={styles['cover-img']} alt={currentShowcase.title} />
                    ) : (
                      <div className={styles['cover-placeholder']}>
                        <span>{currentShowcase.title.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles['showcase-info']}>
                    <p className={styles['showcase-date']}>{currentShowcase.date}</p>
                    <h3 className={styles['showcase-title']}>{currentShowcase.title}</h3>
                    <p className={styles['showcase-desc']}>{currentShowcase.description}</p>
                    {currentShowcase.tags.length > 0 && (
                      <div className={styles['showcase-tags']}>
                        {currentShowcase.tags.map((tag) => (
                          <span key={tag} className={styles.tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </SlideTransition>
            </div>

            <button className={`${styles['carousel-nav']} ${styles.right}`} onClick={showcaseNext}>
              ›
            </button>

            <div className={styles['carousel-dots']}>
              {showcase.map((_, i) => (
                <span
                  key={i}
                  className={`${styles['carousel-dot']}${i === showcaseIndex ? ` ${styles.active}` : ''}`}
                  onClick={() => showcaseGoTo(i)}
                ></span>
              ))}
            </div>
          </div>
        )}
      </div>

      <ShowcaseModal
        showcase={selectedShowcase}
        events={events}
        groups={groupsForModal}
        onClose={closeShowcaseModal}
      />
    </div>
  );
}
