import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { Announcement, AnnouncementInput } from '../types/api';
import { errorMessage } from '../utils/errorMessage';
import { formatCreatedAt } from '../utils/formatCreatedAt';
import Pagination from './Pagination';
import styles from './AnnouncementsManager.module.css';

const PAGE_SIZE = 10;

const emptyForm = (): AnnouncementInput => ({ title: '', content: '', active: false });

export default function AnnouncementsManager() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<AnnouncementInput>(emptyForm());

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginatedItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const setField = <K extends keyof AnnouncementInput>(key: K, value: AnnouncementInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const loadItems = async () => {
    setLoading(true);
    setCurrentPage(1);
    try {
      const data = await api.getAnnouncements();
      data.sort((a, b) => b.created_at.localeCompare(a.created_at));
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (item: Announcement) => {
    setEditingId(item.id);
    setForm({ title: item.title, content: item.content, active: item.active });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => setShowForm(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      if (editingId) {
        await api.updateAnnouncement(editingId, form);
      } else {
        await api.createAnnouncement(form);
      }
      setShowForm(false);
      await loadItems();
    } catch (err) {
      setFormError(errorMessage(err, '儲存失敗'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: Announcement) => {
    if (!confirm('確定要刪除這則通知嗎？')) return;
    try {
      await api.deleteAnnouncement(item.id);
      await loadItems();
    } catch (e) {
      alert(errorMessage(e, '刪除失敗'));
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>全體通知管理</h2>
        <button className={styles['btn-primary']} onClick={openCreateForm}>
          新增通知
        </button>
      </div>

      {loading ? (
        <div>載入中...</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>目前沒有通知資料</div>
      ) : (
        <table className={styles['data-table']}>
          <thead>
            <tr>
              <th>日期</th>
              <th>標題</th>
              <th>顯示中</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item) => (
              <tr key={item.id}>
                <td>{formatCreatedAt(item.created_at)}</td>
                <td>{item.title}</td>
                <td>
                  <span className={item.active ? styles['badge-active'] : styles['badge-inactive']}>
                    {item.active ? '是' : '否'}
                  </span>
                </td>
                <td>
                  <button className={styles['btn-small']} onClick={() => openEditForm(item)}>
                    編輯
                  </button>
                  <button
                    className={`${styles['btn-small']} ${styles['btn-danger']}`}
                    onClick={() => handleDelete(item)}
                  >
                    刪除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />

      {showForm && (
        <div
          className={styles['modal-overlay']}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div className={styles.modal}>
            <h3>{editingId ? '編輯通知' : '新增通知'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>標題</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>通知內容</label>
                <textarea
                  required
                  rows={5}
                  value={form.content}
                  onChange={(e) => setField('content', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles['checkbox-label']}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setField('active', e.target.checked)}
                  />
                  顯示在官網上
                </label>
              </div>
              {formError && <p className={styles.error}>{formError}</p>}
              <div className={styles['form-actions']}>
                <button type="button" className={styles['btn-secondary']} onClick={closeForm}>
                  取消
                </button>
                <button type="submit" className={styles['btn-primary']} disabled={submitting}>
                  {submitting ? '儲存中...' : '儲存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
