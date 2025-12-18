/**
 * ContextMenu - Right-click context menu for notes and folders
 */
import { useEffect, useRef } from 'react';
import styles from './ContextMenu.module.css';

export function ContextMenu({ type, x, y, data, onClose, actions }) {
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${y - rect.height}px`;
      }
    }
  }, [x, y]);

  const handleAction = (action) => {
    action.handler(data);
    onClose();
  };

  // Get actions based on type
  const menuActions = actions[type] || [];

  if (menuActions.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      style={{ left: x, top: y }}
    >
      <div className={styles.header}>
        {type === 'note' && (
          <>
            <span className={styles.headerTitle}>{data?.title || 'Untitled'}</span>
            <span className={styles.headerExt}>.od</span>
          </>
        )}
        {type === 'folder' && (
          <span className={styles.headerTitle}>{data?.name}</span>
        )}
      </div>
      <div className={styles.divider} />
      {menuActions.map((action, index) => (
        action.divider ? (
          <div key={index} className={styles.divider} />
        ) : (
          <button
            key={action.id}
            className={`${styles.item} ${action.danger ? styles.danger : ''}`}
            onClick={() => handleAction(action)}
            disabled={action.disabled}
          >
            {action.icon && <span className={styles.icon}>{action.icon}</span>}
            <span className={styles.label}>{action.label}</span>
            {action.shortcut && <span className={styles.shortcut}>{action.shortcut}</span>}
          </button>
        )
      ))}
    </div>
  );
}

export default ContextMenu;
