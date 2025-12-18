/**
 * TabBar - Tab management for notes and graph views
 */
import styles from './TabBar.module.css';

export function TabBar({ tabs, activeTabId, onTabClick, onTabClose, onNewTab }) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={styles.tabBar}>
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`${styles.tab} ${tab.id === activeTabId ? styles.active : ''}`}
            onClick={() => onTabClick(tab.id)}
          >
            <span className={styles.tabIcon}>
              {tab.type === 'graph' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="18" cy="18" r="3" />
                  <circle cx="18" cy="6" r="3" />
                  <line x1="8.5" y1="7.5" x2="15.5" y2="16.5" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
              )}
            </span>
            <span className={styles.tabTitle}>
              {tab.title}
              {tab.type === 'note' && <span className={styles.tabExt}>.od</span>}
            </span>
            <button
              className={styles.tabClose}
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              title="Close tab"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button className={styles.newTabBtn} onClick={onNewTab} title="New note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}

export default TabBar;
