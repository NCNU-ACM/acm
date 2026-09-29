import type { EventItem, GroupRef, ShowcaseItem } from '../../types/content';
import EventListPanel from '../common/EventListPanel';
import styles from './EventsList.module.css';

interface Props {
  events: EventItem[];
  groups: GroupRef[];
  showcaseItems: ShowcaseItem[];
}

export default function EventsList({ events, groups, showcaseItems }: Props) {
  return (
    <div className={styles['list-section']}>
      <EventListPanel
        events={events}
        groups={groups}
        showcaseItems={showcaseItems}
        pageSize={10}
        maxHeight="480px"
        showGroup={true}
      />
    </div>
  );
}
