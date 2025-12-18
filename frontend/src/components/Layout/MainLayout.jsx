/**
 * MainLayout - Main application layout with sidebar, tabs, and content area
 */
import { TabBar } from './TabBar';
import styles from './MainLayout.module.css';

export function MainLayout({
  sidebar,
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onNewTab,
  children,
  sidebarCollapsed
}) {
  return (
    <div className={styles.layout}>
      <div className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        {sidebar}
      </div>
      <div className={styles.main}>
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={onTabClick}
          onTabClose={onTabClose}
          onNewTab={onNewTab}
        />
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default MainLayout;
