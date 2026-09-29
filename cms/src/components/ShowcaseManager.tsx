import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { EventRow, Group, Link, ShowcaseInput, ShowcaseRow } from '../types/api';
import { errorMessage } from '../utils/errorMessage';
import Pagination from './Pagination';
import styles from './ShowcaseManager.module.css';

const PAGE_SIZE = 10;

interface ShowcaseForm {
  title: string;
  group: string;
  date: string;
  description: string;
  related_event: string;
  cover_image: string;
  gallery: string[];
  tags: string[];
  links: Link[];
}

const emptyForm = (): ShowcaseForm => ({
  title: '',
  group: '',
  date: '',
  description: '',
  related_event: '',
  cover_image: '',
  gallery: [],
  tags: [],
  links: [],
});

export default function ShowcaseManager() {
  const [items, setItems] = useState<ShowcaseRow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<ShowcaseForm>(emptyForm());

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginatedItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const setField = <K extends keyof ShowcaseForm>(key: K, value: ShowcaseForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const groupName = (slug: string) => {
    const g = groups.find((g) => g.slug === slug);
    return g ? g.name : slug;
  };

  // 圖集與標籤都是字串陣列，共用同一組操作
  type StringListKey = 'gallery' | 'tags';
  const addString = (key: StringListKey) => setForm((f) => ({ ...f, [key]: [...f[key], ''] }));
  const removeString = (key: StringListKey, index: number) =>
    setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));
  const setString = (key: StringListKey, index: number, value: string) =>
    setForm((f) => ({ ...f, [key]: f[key].map((s, i) => (i === index ? value : s)) }));

  const addLink = () => setForm((f) => ({ ...f, links: [...f.links, { label: '', url: '' }] }));
  const removeLink = (index: number) =>
    setForm((f) => ({ ...f, links: f.links.filter((_, i) => i !== index) }));
  const setLink = (index: number, field: keyof Link, value: string) =>
    setForm((f) => ({
      ...f,
      links: f.links.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    }));

  // 篩選的 onChange 裡 state 還沒更新，所以小組由呼叫端傳入
  const loadShowcase = async (group: string) => {
    setLoading(true);
    setCurrentPage(1);
    try {
      setItems(await api.getShowcase(group || undefined));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      setGroups(await api.getGroups());
    } catch (e) {
      console.error(e);
    }
  };

  const loadEvents = async () => {
    try {
      setEvents(await api.getEvents());
    } catch (e) {
      console.error(e);
    }
  };

  const openCreateForm = () => {
    setEditingId(null);
    setEditingGroup(null);
    setForm(emptyForm());
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (item: ShowcaseRow) => {
    setEditingId(item.id);
    setEditingGroup(item.group);
    setForm({
      title: item.title,
      group: item.group,
      date: item.date,
      description: item.description,
      related_event: item.related_event || '',
      cover_image: item.cover_image || '',
      gallery: [...(item.gallery || [])],
      tags: [...(item.tags || [])],
      links: (item.links || []).map((l) => ({ ...l })),
    });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => setShowForm(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const payload: ShowcaseInput = {
        ...form,
        tags: form.tags.filter((t) => t.trim()),
        links: form.links.filter((l) => l.label && l.url),
        gallery: form.gallery.filter((g) => g.trim()),
      };
      if (payload.tags?.length === 0) delete payload.tags;
      if (payload.links?.length === 0) delete payload.links;
      if (payload.gallery?.length === 0) delete payload.gallery;
      if (!payload.related_event) delete payload.related_event;
      if (!payload.cover_image) delete payload.cover_image;
      if (editingId && editingGroup) {
        await api.updateShowcase(editingGroup, editingId, payload);
      } else {
        await api.createShowcase(payload);
      }
      setShowForm(false);
      await loadShowcase(filterGroup);
    } catch (err) {
      setFormError(errorMessage(err, '儲存失敗'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ShowcaseRow) => {
    if (!confirm('確定要刪除這個項目嗎？')) return;
    try {
      await api.deleteShowcase(item.group, item.id);
      await loadShowcase(filterGroup);
    } catch (e) {
      alert(errorMessage(e, '刪除失敗'));
    }
  };

  useEffect(() => {
    loadShowcase('');
    loadGroups();
    loadEvents();
  }, []);

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>成果展示管理</h2>
        <button className={styles['btn-primary']} onClick={openCreateForm}>
          新增項目
        </button>
      </div>

      <div className={styles.filter}>
        <label>篩選小組：</label>
        <select
          value={filterGroup}
          onChange={(e) => {
            setFilterGroup(e.target.value);
            loadShowcase(e.target.value);
          }}
        >
          <option value="">全部</option>
          {groups.map((g) => (
            <option key={g.slug} value={g.slug}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>載入中...</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>目前沒有成果展示資料</div>
      ) : (
        <table className={styles['data-table']}>
          <thead>
            <tr>
              <th>日期</th>
              <th>標題</th>
              <th>小組</th>
              <th>標籤</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item) => (
              <tr key={item.id}>
                <td>{item.date}</td>
                <td>{item.title}</td>
                <td>{groupName(item.group)}</td>
                <td>{(item.tags || []).join('、') || '無'}</td>
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
            <h3>{editingId ? '編輯項目' : '新增成果展示項目'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>項目標題</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>所屬小組</label>
                <select
                  required
                  value={form.group}
                  onChange={(e) => setField('group', e.target.value)}
                >
                  <option value="" disabled>
                    請選擇
                  </option>
                  {groups.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>日期</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setField('date', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>簡介</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>關聯活動（選填）</label>
                <select
                  value={form.related_event}
                  onChange={(e) => setField('related_event', e.target.value)}
                >
                  <option value="">無</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {`${ev.title}（${ev.event_date}）`}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>封面圖網址（選填）</label>
                <input
                  placeholder="https://..."
                  value={form.cover_image}
                  onChange={(e) => setField('cover_image', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>圖集（選填）</label>
                {form.gallery.map((img, index) => (
                  <div key={index} className={styles['contact-row']}>
                    <input
                      placeholder="圖片網址"
                      value={img}
                      onChange={(e) => setString('gallery', index, e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles['btn-remove']}
                      onClick={() => removeString('gallery', index)}
                    >
                      移除
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={styles['btn-add']}
                  onClick={() => addString('gallery')}
                >
                  + 新增圖片
                </button>
              </div>
              <div className={styles.field}>
                <label>標籤（選填）</label>
                {form.tags.map((tag, index) => (
                  <div key={index} className={styles['contact-row']}>
                    <input
                      placeholder="標籤名稱"
                      value={tag}
                      onChange={(e) => setString('tags', index, e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles['btn-remove']}
                      onClick={() => removeString('tags', index)}
                    >
                      移除
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={styles['btn-add']}
                  onClick={() => addString('tags')}
                >
                  + 新增標籤
                </button>
              </div>
              <div className={styles.field}>
                <label>相關連結（選填）</label>
                {form.links.map((link, index) => (
                  <div key={index} className={styles['contact-row']}>
                    <input
                      placeholder="連結名稱"
                      value={link.label}
                      onChange={(e) => setLink(index, 'label', e.target.value)}
                    />
                    <input
                      placeholder="連結網址"
                      value={link.url}
                      onChange={(e) => setLink(index, 'url', e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles['btn-remove']}
                      onClick={() => removeLink(index)}
                    >
                      移除
                    </button>
                  </div>
                ))}
                <button type="button" className={styles['btn-add']} onClick={addLink}>
                  + 新增連結
                </button>
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
