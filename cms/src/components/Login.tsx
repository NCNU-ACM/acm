import { useState, type FormEvent } from 'react';
import { api, setToken } from '../api/client';
import { errorMessage } from '../utils/errorMessage';
import styles from './Login.module.css';

interface Props {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.login(username, password);
      setToken(result.token);
      onLoginSuccess();
    } catch (err) {
      setError(errorMessage(err, '登入失敗'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles['login-container']}>
      <div className={styles['login-box']}>
        <h1>NCNU ACM 後台管理</h1>
        <form onSubmit={handleLogin}>
          <div className={styles.field}>
            <label>帳號</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>密碼</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? '登入中...' : '登入'}
          </button>
        </form>
      </div>
    </div>
  );
}
