import { useState } from 'react';
import type { EventItem, GroupRef, ShowcaseItem } from '../../types/content';
import Background from '../common/Background';
import EventModal from '../common/EventModal';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './UpcomingEvents.module.css';

interface Props {
  events: EventItem[];
  groups: GroupRef[];
  showcaseItems: ShowcaseItem[];
}

// events 最多 3 筆（index.astro 的 slice(0, 3)），剛好排滿一列，
// 所以不需要上一張／下一張按鈕、圓點或捲動，卡片固定置中排列。
export default function UpcomingEvents({ events, groups, showcaseItems }: Props) {
  const { containerRef } = useScrollReveal();
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const groupName = (slug: string) => {
    const g = groups.find((g) => g.slug === slug);
    return g ? g.name : slug;
  };

  return (
    <div
      ref={containerRef}
      className={`${styles['events-container']} h-full relative overflow-hidden flex flex-col items-center justify-center px-32`}
    >
      <Background />

      <div className="relative z-10 w-full">
        <div className="text-center mb-10" data-reveal="">
          <p className={`text-sm tracking-widest mb-2 ${styles['section-label']}`}>UPCOMING EVENTS</p>
          <h2 className={`${styles['section-title']} text-5xl md:text-6xl font-bold`}>近期活動</h2>
          <p className={`mt-3 text-lg ${styles['section-subtitle']}`}>掌握最新活動資訊</p>
        </div>

        <div className={styles['carousel-wrapper']} data-reveal="" data-reveal-delay="200">
          <div className={styles['carousel-track']}>
            {events.length === 0 && (
              <div className={`${styles['event-card']} ${styles['empty-card']}`}>
                <p style={{ color: 'var(--color-text-muted)' }}>目前沒有近期活動</p>
              </div>
            )}
            {events.map((event, index) => (
              <div
                key={event.id}
                className={styles['event-card']}
                data-reveal=""
                data-reveal-delay={300 + index * 100}
                onClick={() => setSelectedEvent(event)}
              >
                <div className={styles['event-card-inner']}>
                  <h3 className="text-xl font-bold mb-3">{event.title}</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                    {event.description}
                  </p>
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={styles.tag}>{event.type}</span>
                      <span className={`${styles.tag} ${styles['tag-group']}`}>{groupName(event.group)}</span>
                    </div>
                    <div className={styles['event-meta']}>
                      <span>{`📅 ${event.date}`}</span>
                      {event.location && <span>{`📍 ${event.location}`}</span>}
                    </div>
                  </div>
                </div>
                <div className={styles['card-border-bottom']}></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <EventModal
        event={selectedEvent}
        groups={groups}
        showcaseItems={showcaseItems}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
