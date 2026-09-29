import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { EventInput, EventRow, Group, Link } from '../types/api';
import { errorMessage } from '../utils/errorMessage';
import Pagination from './Pagination';
import styles from './EventsManager.module.css';

const PAGE_SIZE = 10;
const EVENT_TYPES = ['招募', '演講', '競賽', '工作坊', '其他'];

interface EventForm {
  title: string;
  event_date: string;
  group: string;
  type: string;
  location: string;
  description: string;
  content: string;
  links: Link[];
  registration: string;
}

const emptyForm = (): EventForm => ({
  title: '',
  event_date: '',
  group: '',
  type: '',
  location: '',
  description: '',
  content: '',
  links: [],
  registration: '',
});

export default function EventsManager() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<EventForm>(emptyForm());

  const totalPages = Math.ceil(events.length / PAGE_SIZE);
  const paginatedEvents = events.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const setField = <K extends keyof EventForm>(key: K, value: EventForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const groupName = (slug: string) => {
    const g = groups.find((g) => g.slug === slug);
    return g ? g.name : slug;
  };

  const addLink = () => setForm((f) => ({ ...f, links: [...f.links, { label: '', url: '' }] }));
  const removeLink = (index: number) =>
    setForm((f) => ({ ...f, links: f.links.filter((_, i) => i !== index) }));
  const setLink = (index: number, field: keyof Link, value: string) =>
    setForm((f) => ({
      ...f,
      links: f.links.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    }));

  const loadEvents = async () => {
    setLoading(true);
    setCurrentPage(1);
    try {
      const data = await api.getEvents();
      data.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
      setEvents(data);
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

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (event: EventRow) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      event_date: event.event_date,
      group: event.group,
      type: event.type,
      location: event.location || '',
      description: event.description,
      content: event.content || '',
      links: (event.links || []).map((l) => ({ ...l })),
      registration: event.registration || '',
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
      const payload: EventInput = {
        ...form,
        links: form.links.filter((l) => l.label && l.url),
      };
      if (!payload.location) delete payload.location;
      if (!payload.content) delete payload.content;
      if (!payload.registration) delete payload.registration;
      if (payload.links?.length === 0) delete payload.links;
      if (editingId) {
        await api.updateEvent(editingId, payload);
      } else {
        await api.createEvent(payload);
      }
      setShowForm(false);
      await loadEvents();
    } catch (err) {
      setFormError(errorMessage(err, '儲存失敗'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (event: EventRow) => {
    if (!confirm('確定要刪除這個活動嗎？')) return;
    try {
      await api.deleteEvent(event.id);
      await loadEvents();
    } catch (e) {
      alert(errorMessage(e, '刪除失敗'));
    }
  };

  useEffect(() => {
    loadEvents();
    loadGroups();
  }, []);

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>活動管理</h2>
        <button className={styles['btn-primary']} onClick={openCreateForm}>
          新增活動
        </button>
      </div>

      {loading ? (
        <div>載入中...</div>
      ) : events.length === 0 ? (
        <div className={styles.empty}>目前沒有活動資料</div>
      ) : (
        <table className={styles['data-table']}>
          <thead>
            <tr>
              <th>日期</th>
              <th>標題</th>
              <th>小組</th>
              <th>類型</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEvents.map((event) => (
              <tr key={event.id}>
                <td>{event.event_date}</td>
                <td>{event.title}</td>
                <td>{groupName(event.group)}</td>
                <td>{event.type}</td>
                <td>
                  <button className={styles['btn-small']} onClick={() => openEditForm(event)}>
                    編輯
                  </button>
                  <button
                    className={`${styles['btn-small']} ${styles['btn-danger']}`}
                    onClick={() => handleDelete(event)}
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
            <h3>{editingId ? '編輯活動' : '新增活動'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>活動標題</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>活動日期</label>
                <input
                  type="date"
                  required
                  value={form.event_date}
                  onChange={(e) => setField('event_date', e.target.value)}
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
                <label>活動類型</label>
                <select
                  required
                  value={form.type}
                  onChange={(e) => setField('type', e.target.value)}
                >
                  <option value="" disabled>
                    請選擇
                  </option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>地點（選填）</label>
                <input
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
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
                <label>詳細內容（選填）</label>
                <textarea
                  rows={6}
                  value={form.content}
                  onChange={(e) => setField('content', e.target.value)}
                />
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
              <div className={styles.field}>
                <label>報名連結（選填）</label>
                <input
                  value={form.registration}
                  onChange={(e) => setField('registration', e.target.value)}
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
