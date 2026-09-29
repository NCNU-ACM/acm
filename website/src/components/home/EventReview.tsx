import { useMemo, useState } from 'react';
import type { EventItem, GroupRef, ShowcaseItem } from '../../types/content';
import Background from '../common/Background';
import EventModal from '../common/EventModal';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './EventReview.module.css';

interface Props {
  events: EventItem[];
  groups: GroupRef[];
  showcaseItems: ShowcaseItem[];
}

export default function EventReview({ events, groups, showcaseItems }: Props) {
  const reversedEvents = useMemo(() => [...events].reverse(), [events]);
  const { containerRef } = useScrollReveal();
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  return (
    <div
      ref={containerRef}
      className={`${styles['review-container']} h-full relative overflow-hidden flex flex-col items-center justify-center px-16`}
    >
      <Background />

      <div className="relative z-10 w-full">
        <div className="text-center mb-12" data-reveal="">
          <p className={`text-sm tracking-widest mb-2 ${styles['section-label']}`}>EVENT REVIEW</p>
          <h2 className={`${styles['section-title']} text-5xl md:text-6xl font-bold`}>活動回顧</h2>
          <p className={`mt-3 text-lg ${styles['section-subtitle']}`}>我們一起走過的足跡</p>
        </div>

        {events.length === 0 ? (
          <div
            className="text-center"
            style={{ color: 'var(--color-text-muted)' }}
            data-reveal=""
            data-reveal-delay="200"
          >
            目前沒有歷史活動
          </div>
        ) : (
          <div className={styles['timeline-wrapper']} data-reveal="" data-reveal-delay="200">
            <div className={styles['timeline-line']}></div>
            <div className={styles['timeline-track']}>
              {reversedEvents.map((event, i) => (
                <div
                  key={event.id}
                  className={`${styles['timeline-item']} ${i % 2 === 0 ? styles['item-top'] : styles['item-bottom']}`}
                  data-reveal=""
                  data-reveal-follow=""
                  data-reveal-delay={300 + i * 100}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className={styles['timeline-dot']}></div>
                  <div className={styles['timeline-card']}>
                    <p className={styles['timeline-date']}>{event.date}</p>
                    <h3 className="font-bold">{event.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
