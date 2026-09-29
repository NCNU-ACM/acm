import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import type { EventItem, GroupRef, ShowcaseItem } from '../../types/content';
import ModalPortal from './ModalPortal';
import styles from './EventModal.module.css';

interface Props {
  event: EventItem | null;
  groups: GroupRef[];
  showcaseItems: ShowcaseItem[];
  onClose: () => void;
}

type ViewMode = 'announcement' | 'recap';

export default function EventModal({ event, groups, showcaseItems, onClose }: Props) {
  // body 捲動鎖：掛載時不碰 body，只有 event 之後變動才鎖／解鎖。
  // 用 layout effect 讓它在繪製前執行，modal 的第一個 frame 就已鎖定。
  const mounted = useRef(false);
  useLayoutEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    document.body.style.overflow = event ? 'hidden' : '';
  }, [event]);

  // 卸載時一律設成 ''（不是還原先前的值）
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!event) return null;

  // key 讓 viewMode 在每次開啟（或直接換成另一筆）時重置為 'announcement'，
  // 不必用 effect 重設，也就不會在開啟的第一個 frame 閃現上次的分頁
  return (
    <EventModalContent
      key={event.id}
      event={event}
      groups={groups}
      showcaseItems={showcaseItems}
      onClose={onClose}
    />
  );
}

function EventModalContent({
  event,
  groups,
  showcaseItems,
  onClose,
}: Props & { event: EventItem }) {
  const [viewMode, setViewMode] = useState<ViewMode>('announcement');

  useEscapeKey(onClose);

  const relatedShowcase = showcaseItems.find((s) => s.related_event === event.id) || null;

  const groupName = (slug: string) => {
    const g = groups.find((g) => g.slug === slug);
    return g ? g.name : slug;
  };

  return (
    <ModalPortal>
      <div
        className={styles['modal-overlay']}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* index.astro 的 wheel 攔截靠 closest('.modal')，所以要保留字面 class */}
        <div className={`modal ${styles.modal}`}>
          <button className={styles['modal-close']} onClick={onClose}>
            ×
          </button>

          {relatedShowcase && (
            <div className={styles['view-toggle']}>
              <button
                className={`${styles['toggle-btn']}${viewMode === 'announcement' ? ` ${styles.active}` : ''}`}
                onClick={() => setViewMode('announcement')}
              >
                活動公告
              </button>
              <button
                className={`${styles['toggle-btn']}${viewMode === 'recap' ? ` ${styles.active}` : ''}`}
                onClick={() => setViewMode('recap')}
              >
                活動回顧
              </button>
            </div>
          )}

          {viewMode === 'announcement' ? (
            <div>
              <div className={styles['modal-tags']}>
                {event.isAnnouncement ? (
                  <span className={`${styles.tag} ${styles['announcement-tag']}`}>通知</span>
                ) : (
                  <span className={styles.tag}>{event.type}</span>
                )}
                {!event.isAnnouncement && event.group && (
                  <span className={`${styles.tag} ${styles['tag-group']}`}>{groupName(event.group)}</span>
                )}
              </div>
              <h2 className={styles['modal-title']}>{event.title}</h2>
              <div className={styles['modal-meta']}>
                {!event.isAnnouncement ? (
                  <span>{`活動日期: ${event.date}`}</span>
                ) : (
                  <span>{`發布日期: ${event.date}`}</span>
                )}
                {event.location && <span>{`活動地點: ${event.location}`}</span>}
              </div>

              {event.content && <p className={styles['modal-description']}>{event.content}</p>}

              {event.links && event.links.length > 0 && (
                <div className={styles['modal-links']}>
                  {event.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      className={styles['modal-link-item']}
                    >
                      {`🔗 ${link.label}`}
                    </a>
                  ))}
                </div>
              )}

              {event.registration && (
                <a href={event.registration} target="_blank" className={styles['modal-register-btn']}>
                  立即報名 →
                </a>
              )}
            </div>
          ) : (
            relatedShowcase && (
              <div>
                <div className={styles['modal-tags']}>
                  {!event.isAnnouncement && <span className={styles.tag}>{event.type}</span>}
                  {event.isAnnouncement && (
                    <span className={`${styles.tag} ${styles['announcement-tag']}`}>通知</span>
                  )}
                  {!event.isAnnouncement && event.group && (
                    <span className={`${styles.tag} ${styles['tag-group']}`}>{groupName(event.group)}</span>
                  )}
                </div>
                <h2 className={styles['modal-title']}>{relatedShowcase.title}</h2>
                <div className={styles['modal-meta']}>
                  <span>{`📅 ${relatedShowcase.date}`}</span>
                </div>

                {relatedShowcase.cover_image && (
                  <img src={relatedShowcase.cover_image} className={styles['cover-image']} />
                )}

                <p className={styles['modal-description']}>{relatedShowcase.description}</p>

                {relatedShowcase.gallery && relatedShowcase.gallery.length > 0 && (
                  <div className={styles['gallery-grid']}>
                    {relatedShowcase.gallery.map((img, i) => (
                      <img key={i} src={img} className={styles['gallery-image']} />
                    ))}
                  </div>
                )}

                {relatedShowcase.links && relatedShowcase.links.length > 0 && (
                  <div className={styles['modal-links']}>
                    {relatedShowcase.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        className={styles['modal-link-item']}
                      >
                        {`🔗 ${link.label}`}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
