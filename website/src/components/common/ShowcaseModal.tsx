import { useState } from 'react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import type { EventItem, GroupRef, ShowcaseItem } from '../../types/content';
import ModalPortal from './ModalPortal';
import styles from './ShowcaseModal.module.css';

interface Props {
  showcase: ShowcaseItem | null;
  events: EventItem[];
  groups: GroupRef[];
  onClose: () => void;
}

type ViewMode = 'showcase' | 'announcement';

// 用 key 讓內容元件在每次開啟時重新掛載，viewMode 與 lightboxIndex 自然回到初始值（不必在 effect 裡重設）
export default function ShowcaseModal({ showcase, events, groups, onClose }: Props) {
  if (!showcase) return null;
  return (
    <ShowcaseModalContent key={showcase.id} showcase={showcase} events={events} groups={groups} onClose={onClose} />
  );
}

function ShowcaseModalContent({
  showcase,
  events,
  groups,
  onClose,
}: Props & { showcase: ShowcaseItem }) {
  const [viewMode, setViewMode] = useState<ViewMode>('showcase');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const relatedEvent = (showcase.related_event && events.find((e) => e.id === showcase.related_event)) || null;

  const groupName = (slug: string) => {
    const g = groups.find((g) => g.slug === slug);
    return g ? g.name : slug;
  };

  const gallery = showcase.gallery ?? [];

  // lightbox 開著時 ESC 只關 lightbox，底下的 modal 留著；再按一次才關 modal
  useEscapeKey(() => {
    if (lightboxIndex !== null) setLightboxIndex(null);
    else onClose();
  });

  const lightboxPrev = () => {
    if (lightboxIndex === null || !showcase.gallery) return;
    setLightboxIndex((lightboxIndex - 1 + showcase.gallery.length) % showcase.gallery.length);
  };

  const lightboxNext = () => {
    if (lightboxIndex === null || !showcase.gallery) return;
    setLightboxIndex((lightboxIndex + 1) % showcase.gallery.length);
  };

  return (
    <ModalPortal>
      <div
        className={styles['modal-overlay']}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className={styles.modal}>
          <button className={styles['modal-close']} onClick={onClose}>
            ×
          </button>

          {relatedEvent && (
            <div className={styles['view-toggle']}>
              <button
                className={`${styles['toggle-btn']}${viewMode === 'showcase' ? ` ${styles.active}` : ''}`}
                onClick={() => setViewMode('showcase')}
              >
                活動回顧
              </button>
              <button
                className={`${styles['toggle-btn']}${viewMode === 'announcement' ? ` ${styles.active}` : ''}`}
                onClick={() => setViewMode('announcement')}
              >
                活動公告
              </button>
            </div>
          )}

          {viewMode === 'showcase' ? (
            <div>
              <div className={styles['modal-tags']}>
                <span className={`${styles.tag} ${styles['tag-group']}`}>{groupName(showcase.group)}</span>
                {showcase.tags?.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className={styles['modal-title']}>{showcase.title}</h2>
              <div className={styles['modal-meta']}>
                <span>{`📅 ${showcase.date}`}</span>
              </div>

              {showcase.cover_image && (
                <img src={showcase.cover_image} className={styles['cover-image']} alt={showcase.title} />
              )}

              <p className={styles['modal-description']}>{showcase.description}</p>

              {gallery.length > 0 && (
                <div className={styles['gallery-grid']}>
                  {gallery.map((img, i) => (
                    <img key={i} src={img} className={styles['gallery-image']} onClick={() => setLightboxIndex(i)} />
                  ))}
                </div>
              )}

              {showcase.links && showcase.links.length > 0 && (
                <div className={styles['modal-links']}>
                  {showcase.links.map((link) => (
                    <a key={link.label} href={link.url} target="_blank" className={styles['modal-link-item']}>
                      {`🔗 ${link.label}`}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            relatedEvent && (
              <div>
                <div className={styles['modal-tags']}>
                  <span className={styles.tag}>{relatedEvent.type}</span>
                  <span className={`${styles.tag} ${styles['tag-group']}`}>{groupName(relatedEvent.group)}</span>
                </div>
                <h2 className={styles['modal-title']}>{relatedEvent.title}</h2>
                <div className={styles['modal-meta']}>
                  <span>{`📅 ${relatedEvent.date}`}</span>
                  {relatedEvent.location && <span>{`📍 ${relatedEvent.location}`}</span>}
                </div>

                {relatedEvent.content && <p className={styles['modal-description']}>{relatedEvent.content}</p>}

                {relatedEvent.links && relatedEvent.links.length > 0 && (
                  <div className={styles['modal-links']}>
                    {relatedEvent.links.map((link) => (
                      <a key={link.label} href={link.url} target="_blank" className={styles['modal-link-item']}>
                        {`🔗 ${link.label}`}
                      </a>
                    ))}
                  </div>
                )}

                {relatedEvent.registration && (
                  <a href={relatedEvent.registration} target="_blank" className={styles['modal-register-btn']}>
                    立即報名 →
                  </a>
                )}
              </div>
            )
          )}
        </div>

        {lightboxIndex !== null && (
          <div className={styles.lightbox} onClick={() => setLightboxIndex(null)}>
            <button
              className={styles['lightbox-close']}
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(null);
              }}
            >
              ×
            </button>
            <button
              className={styles['lightbox-prev']}
              onClick={(e) => {
                e.stopPropagation();
                lightboxPrev();
              }}
            >
              ‹
            </button>
            <img src={gallery[lightboxIndex]} className={styles['lightbox-img']} onClick={(e) => e.stopPropagation()} />
            <button
              className={styles['lightbox-next']}
              onClick={(e) => {
                e.stopPropagation();
                lightboxNext();
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </ModalPortal>
  );
}
