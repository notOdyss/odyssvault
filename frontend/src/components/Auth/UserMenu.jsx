/**
 * UserMenu - Dropdown menu for authenticated users
 */
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store';
import styles from './Auth.module.css';

export function UserMenu() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const { user, logout, isLoading } = useAuthStore();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (!user) return null;

  const initials = user.username
    ? user.username.slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <button
        className={styles.userMenuTrigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>
            {user.is_guest ? 'Guest' : user.username}
          </span>
          {!user.is_guest && (
            <span className={styles.userEmail}>{user.email}</span>
          )}
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
        >
          <polyline points="6 15 12 9 18 15" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.userMenuDropdown}>
          <div className={styles.userMenuHeader}>
            <p>{user.is_guest ? 'Guest User' : user.username}</p>
            <span>{user.is_guest ? t('auth.guestNote') : user.email}</span>
          </div>

          <button
            className={`${styles.userMenuItem} ${styles.danger}`}
            onClick={handleLogout}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {t('auth.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
