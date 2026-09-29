import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { Group } from '../types/api';
import { errorMessage } from '../utils/errorMessage';
import Pagination from './Pagination';
import styles from './GroupsManager.module.css';

const PAGE_SIZE = 10;

const emptyForm = (order: number): Group => ({
  name: '',
  slug: '',
  order,
  tagline: '',
  description: '',
  color: '#3b82f6',
});

export default function GroupsManager() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<Group>(emptyForm(1));

  const totalPages = Math.ceil(groups.length / PAGE_SIZE);
  const paginatedGroups = groups.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const setField = <K extends keyof Group>(key: K, value: Group[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // 回傳最新的清單：刪除後的重排要用它，不能讀 state（await 之後 state 在這個閉包裡還是舊的）。
  // 載入失敗時畫面維持原本的清單，回傳值也是那份。
  const loadGroups = async (): Promise<Group[]> => {
    setLoading(true);
    setCurrentPage(1);
    try {
      const data = await api.getGroups();
      data.sort((a, b) => a.order - b.order);
      setGroups(data);
      return data;
    } catch (e) {
      console.error(e);
      return groups;
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditingSlug(null);
    const nextOrder = groups.length > 0 ? Math.max(...groups.map((g) => g.order)) + 1 : 1;
    setForm(emptyForm(nextOrder));
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (group: Group) => {
    setEditingSlug(group.slug);
    setForm({ ...group });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => setShowForm(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      if (editingSlug) {
        await api.updateGroup(editingSlug, form);
      } else {
        await api.createGroup(form);
      }
      setShowForm(false);
      await loadGroups();
    } catch (err) {
      setFormError(errorMessage(err, '儲存失敗'));
    } finally {
      setSubmitting(false);
    }
  };

  // 刪除後把 order 補成連續的 1..n，只對 order 不對的小組送 PUT，且一筆送完再送下一筆。
  const reorderAfterDelete = async (current: Group[]) => {
    const sorted = [...current].sort((a, b) => a.order - b.order);
    for (let i = 0; i < sorted.length; i++) {
      const newOrder = i + 1;
      if (sorted[i].order !== newOrder) {
        await api.updateGroup(sorted[i].slug, { ...sorted[i], order: newOrder });
      }
    }
    await loadGroups();
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('確定要刪除這個小組嗎？')) return;
    try {
      await api.deleteGroup(slug);
      const remaining = await loadGroups();
      await reorderAfterDelete(remaining);
    } catch (e) {
      alert(errorMessage(e, '刪除失敗'));
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>小組管理</h2>
        <button className={styles['btn-primary']} onClick={openCreateForm}>
          新增小組
        </button>
      </div>

      {loading ? (
        <div>載入中...</div>
      ) : groups.length === 0 ? (
        <div className={styles.empty}>目前沒有小組資料</div>
      ) : (
        <table className={styles['data-table']}>
          <thead>
            <tr>
              <th>名稱</th>
              <th>網址代稱</th>
              <th>一句話介紹</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedGroups.map((group) => (
              <tr key={group.slug}>
                <td>{group.name}</td>
                <td>{group.slug}</td>
                <td>{group.tagline}</td>
                <td>
                  <button className={styles['btn-small']} onClick={() => openEditForm(group)}>
                    編輯
                  </button>
                  <button
                    className={`${styles['btn-small']} ${styles['btn-danger']}`}
                    onClick={() => handleDelete(group.slug)}
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
            <h3>{editingSlug ? '編輯小組' : '新增小組'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>小組名稱</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>網址代稱（英文，例如 system）</label>
                <input
                  required
                  disabled={!!editingSlug}
                  value={form.slug}
                  onChange={(e) => setField('slug', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>一句話介紹</label>
                <input
                  required
                  value={form.tagline}
                  onChange={(e) => setField('tagline', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>詳細說明</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>主題色</label>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setField('color', e.target.value)}
                />
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
