import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { Group, Link, Member, MemberInput } from '../types/api';
import { academicYearOptions, getAcademicTerm } from '../utils/academicTerm';
import { errorMessage } from '../utils/errorMessage';
import Pagination from './Pagination';
import styles from './MembersManager.module.css';

const PAGE_SIZE = 10;

interface MemberForm {
  name: string;
  group: string;
  role: string;
  bio: string;
  avatar: string;
  contact: Link[];
}

const emptyForm = (): MemberForm => ({
  name: '',
  group: '',
  role: '',
  bio: '',
  avatar: '',
  contact: [],
});

export default function MembersManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSemester, setEditingSemester] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [academicYear, setAcademicYear] = useState(() => getAcademicTerm().year);
  const [semesterPart, setSemesterPart] = useState<string>(() => getAcademicTerm().part);
  const [form, setForm] = useState<MemberForm>(emptyForm());

  const semesters = Array.from(new Set(members.map((m) => m.semester))).sort().reverse();

  const totalPages = Math.ceil(members.length / PAGE_SIZE);
  const paginatedMembers = members.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const setField = <K extends keyof MemberForm>(key: K, value: MemberForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const groupName = (slug: string | null) => {
    if (!slug) return '社團整體';
    const g = groups.find((g) => g.slug === slug);
    return g ? g.name : slug;
  };

  const addContact = () =>
    setForm((f) => ({ ...f, contact: [...f.contact, { label: '', url: '' }] }));
  const removeContact = (index: number) =>
    setForm((f) => ({ ...f, contact: f.contact.filter((_, i) => i !== index) }));
  const setContact = (index: number, field: keyof Link, value: string) =>
    setForm((f) => ({
      ...f,
      contact: f.contact.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }));

  // 篩選的 onChange 裡 state 還沒更新，所以學期由呼叫端傳入
  const loadMembers = async (semester: string) => {
    setLoading(true);
    setCurrentPage(1);
    try {
      setMembers(await api.getMembers(semester || undefined));
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
    setEditingSemester(null);
    const term = getAcademicTerm();
    setAcademicYear(term.year);
    setSemesterPart(term.part);
    setForm(emptyForm());
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (member: Member) => {
    setEditingId(member.id);
    setEditingSemester(member.semester);
    setAcademicYear(parseInt(member.semester.slice(0, -1)));
    setSemesterPart(member.semester.slice(-1));
    setForm({
      name: member.name,
      group: member.group || '',
      role: member.role,
      bio: member.bio || '',
      avatar: member.avatar || '',
      contact: (member.contact || []).map((c) => ({ ...c })),
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
      const payload: MemberInput = {
        semester: `${academicYear}${semesterPart}`,
        ...form,
        contact: form.contact.filter((c) => c.label && c.url),
      };
      if (!payload.group) delete payload.group;
      if (!payload.bio) delete payload.bio;
      if (!payload.avatar) delete payload.avatar;
      if (editingId && editingSemester) {
        await api.updateMember(editingSemester, editingId, payload);
      } else {
        await api.createMember(payload);
      }
      setShowForm(false);
      await loadMembers(filterSemester);
    } catch (err) {
      setFormError(errorMessage(err, '儲存失敗'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (member: Member) => {
    if (!confirm('確定要刪除這位幹部嗎？')) return;
    try {
      await api.deleteMember(member.semester, member.id);
      await loadMembers(filterSemester);
    } catch (e) {
      alert(errorMessage(e, '刪除失敗'));
    }
  };

  useEffect(() => {
    loadMembers('');
    loadGroups();
  }, []);

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>幹部管理</h2>
        <button className={styles['btn-primary']} onClick={openCreateForm}>
          新增幹部
        </button>
      </div>

      <div className={styles.filter}>
        <label>篩選學期：</label>
        <select
          value={filterSemester}
          onChange={(e) => {
            setFilterSemester(e.target.value);
            loadMembers(e.target.value);
          }}
        >
          <option value="">全部</option>
          {semesters.map((sem) => (
            <option key={sem} value={sem}>
              {sem}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>載入中...</div>
      ) : members.length === 0 ? (
        <div className={styles.empty}>目前沒有幹部資料</div>
      ) : (
        <table className={styles['data-table']}>
          <thead>
            <tr>
              <th>姓名</th>
              <th>小組</th>
              <th>職稱</th>
              <th>聯絡方式</th>
              <th>學期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMembers.map((member) => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{groupName(member.group)}</td>
                <td>{member.role}</td>
                <td>{(member.contact || []).map((c) => c.label).join('、') || '無'}</td>
                <td>{member.semester}</td>
                <td>
                  <button className={styles['btn-small']} onClick={() => openEditForm(member)}>
                    編輯
                  </button>
                  <button
                    className={`${styles['btn-small']} ${styles['btn-danger']}`}
                    onClick={() => handleDelete(member)}
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
            <h3>{editingId ? '編輯幹部' : '新增幹部'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>學期</label>
                <div className={styles['semester-selects']}>
                  <select
                    value={academicYear}
                    disabled={!!editingId}
                    onChange={(e) => setAcademicYear(Number(e.target.value))}
                  >
                    {academicYearOptions(getAcademicTerm().year).map((y) => (
                      <option key={y} value={y}>
                        {`${y} 學年`}
                      </option>
                    ))}
                  </select>
                  <select
                    value={semesterPart}
                    disabled={!!editingId}
                    onChange={(e) => setSemesterPart(e.target.value)}
                  >
                    <option value="1">上學期</option>
                    <option value="2">下學期</option>
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label>姓名</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>所屬小組</label>
                <select value={form.group} onChange={(e) => setField('group', e.target.value)}>
                  <option value="">無</option>
                  {groups.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>職稱</label>
                <input
                  required
                  placeholder="例如：組長、副組長等"
                  value={form.role}
                  onChange={(e) => setField('role', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>自我介紹（選填）</label>
                <textarea
                  rows={3}
                  placeholder="簡短的自我介紹"
                  value={form.bio}
                  onChange={(e) => setField('bio', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>頭像圖片網址（選填）</label>
                <input
                  placeholder="https://..."
                  value={form.avatar}
                  onChange={(e) => setField('avatar', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>聯絡方式</label>
                {form.contact.map((item, index) => (
                  <div key={index} className={styles['contact-row']}>
                    <input
                      placeholder="平台名稱，例如 GitHub"
                      value={item.label}
                      onChange={(e) => setContact(index, 'label', e.target.value)}
                    />
                    <input
                      placeholder="連結網址"
                      value={item.url}
                      onChange={(e) => setContact(index, 'url', e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles['btn-remove']}
                      onClick={() => removeContact(index)}
                    >
                      移除
                    </button>
                  </div>
                ))}
                <button type="button" className={styles['btn-add']} onClick={addContact}>
                  + 新增聯絡方式
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
