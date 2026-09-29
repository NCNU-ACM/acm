import { useRef, useState, type CSSProperties } from 'react';
import type { EventItem, GroupRef, ShowcaseItem } from '../../types/content';
import EventModal from './EventModal';
import styles from './EventListPanel.module.css';

interface Props {
  events: EventItem[];
  groups: GroupRef[];
  showcaseItems: ShowcaseItem[];
  pageSize?: number;
  maxHeight?: string;
  showGroup?: boolean;
}

const formatDay = (dateStr: string) => dateStr.split('/')[2];
const formatMonth = (dateStr: string) => `${dateStr.split('/')[1]}月`;

export default function EventListPanel({
  events,
  groups,
  showcaseItems,
  pageSize = 10,
  maxHeight = '640px',
  showGroup = false,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [marqueeOffsets, setMarqueeOffsets] = useState<Record<string, number>>({});
  const [marqueeDurations, setMarqueeDurations] = useState<Record<string, number>>({});

  // 量寬度用的 DOM 參照，不驅動畫面
  const wrapperRefs = useRef<Record<string, HTMLElement>>({});
  const textRefs = useRef<Record<string, HTMLElement>>({});

  const totalPages = Math.ceil(events.length / pageSize);
  const paginatedEvents = events.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const groupName = (slug: string) => {
    const g = groups.find((g) => g.slug === slug);
    return g ? g.name : slug;
  };

  const startMarquee = (id: string) => {
    const wrapper = wrapperRefs.current[id];
    const text = textRefs.current[id];
    if (!wrapper || !text) return;
    const overflow = text.scrollWidth - wrapper.clientWidth;
    if (overflow > 0) {
      setMarqueeDurations((d) => ({ ...d, [id]: overflow / 40 }));
      setMarqueeOffsets((o) => ({ ...o, [id]: -overflow }));
    }
  };

  const stopMarquee = (id: string) => {
    setMarqueeDurations((d) => ({ ...d, [id]: 0.5 }));
    setMarqueeOffsets((o) => ({ ...o, [id]: 0 }));
  };

  // 以 CSS 變數把 maxHeight 傳給樣式表（module.css 內以 var(--max-height) 使用）
  const rootStyle = { '--max-height': maxHeight } as CSSProperties;

  return (
    <div style={rootStyle}>
      {events.length === 0 ? (
        <div className={styles.empty}>目前沒有相關活動</div>
      ) : (
        <div className={styles['list-grid-wrapper']}>
          <div className={styles['list-grid']}>
            {paginatedEvents.map((event) => (
              <div
                key={event.id}
                className={`${styles['event-row']}${event.isAnnouncement ? ` ${styles['announcement-row']}` : ''}`}
                onClick={() => setSelectedEvent(event)}
                onMouseEnter={() => startMarquee(event.id)}
                onMouseLeave={() => stopMarquee(event.id)}
              >
                <div className={styles['row-date']}>
                  <span className={styles['date-day']}>{formatDay(event.date)}</span>
                  <span className={styles['date-month']}>{formatMonth(event.date)}</span>
                </div>
                <div className={styles['row-content']}>
                  <h3 className={styles['row-title']}>{event.title}</h3>
                  {/* ref callback 要寫成有大括號的函式：React 19 會把回傳值當成 cleanup */}
                  <div
                    className={styles['marquee-wrapper']}
                    ref={(el) => {
                      if (el) wrapperRefs.current[event.id] = el;
                    }}
                  >
                    <p
                      className={styles['row-description']}
                      ref={(el) => {
                        if (el) textRefs.current[event.id] = el;
                      }}
                      style={{
                        transform: `translateX(${marqueeOffsets[event.id] || 0}px)`,
                        transitionDuration: `${marqueeDurations[event.id] || 0.5}s`,
                      }}
                    >
                      {event.description}
                    </p>
                  </div>
                </div>
                {event.isAnnouncement ? (
                  <div className={`${styles['row-tag']} ${styles['announcement-tag']}`}>通知</div>
                ) : (
                  showGroup &&
                  event.group && (
                    <div className={`${styles['row-tag']} ${styles['group-tag']}`}>{groupName(event.group)}</div>
                  )
                )}
                <div className={styles['row-arrow']}>›</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles['page-btn']}
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`${styles['page-btn']}${page === currentPage ? ` ${styles.active}` : ''}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            className={styles['page-btn']}
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
      )}

      <EventModal
        event={selectedEvent}
        groups={groups}
        showcaseItems={showcaseItems}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
