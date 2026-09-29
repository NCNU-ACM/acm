import styles from './Pagination.module.css';

interface Props {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

function getDisplayedPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);

  return pages;
}

export default function Pagination({ currentPage, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <button
        className={styles['page-btn']}
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ‹
      </button>
      {getDisplayedPages(currentPage, totalPages).map((page, index) => {
        const classNames = [styles['page-btn']];
        if (page === currentPage) classNames.push(styles.active);
        if (page === '...') classNames.push(styles.ellipsis);
        return (
          <button
            // 省略號可能同時出現兩個，不能拿頁碼當 key；頁碼本身則維持以頁碼為 key
            key={page === '...' ? `ellipsis-${index}` : page}
            className={classNames.join(' ')}
            disabled={page === '...'}
            onClick={() => {
              if (typeof page === 'number') onChange(page);
            }}
          >
            {page}
          </button>
        );
      })}
      <button
        className={styles['page-btn']}
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        ›
      </button>
    </div>
  );
}
