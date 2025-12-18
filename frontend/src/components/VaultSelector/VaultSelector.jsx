/**
 * VaultSelector - Dropdown to switch between vaults and manage them
 */
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store';
import styles from './VaultSelector.module.css';

export function VaultSelector() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVaultName, setNewVaultName] = useState('');
  const [error, setError] = useState('');
  const menuRef = useRef(null);

  const { vaults, activeVaultId, setActiveVault, createVault, deleteVault } = useAuthStore();

  const activeVault = vaults.find(v => v.id === activeVaultId);

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

  const handleCreateVault = async (e) => {
    e.preventDefault();
    setError('');

    if (!newVaultName.trim()) {
      setError('Vault name is required');
      return;
    }

    const result = await createVault(newVaultName.trim());
    if (result.success) {
      setNewVaultName('');
      setShowCreateModal(false);
      setIsOpen(false);
    } else {
      setError(result.error || 'Failed to create vault');
    }
  };

  const handleDeleteVault = async (vault) => {
    if (vault.is_default) {
      alert(t('vault.cannotDeleteDefault'));
      return;
    }

    if (!window.confirm(`Delete vault "${vault.name}"? All notes inside will be deleted.`)) {
      return;
    }

    const result = await deleteVault(vault.id);
    if (!result.success) {
      alert(result.error || 'Failed to delete vault');
    }
  };

  if (vaults.length === 0) return null;

  return (
    <div className={styles.vaultSelector} ref={menuRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        title={t('vault.switchVault')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span className={styles.vaultName}>{activeVault?.name || 'Select Vault'}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>{t('vault.title')}</span>
          </div>

          <div className={styles.vaultList}>
            {vaults.map(vault => (
              <div
                key={vault.id}
                className={`${styles.vaultItem} ${vault.id === activeVaultId ? styles.active : ''}`}
              >
                <button
                  className={styles.vaultBtn}
                  onClick={() => {
                    setActiveVault(vault.id);
                    setIsOpen(false);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>{vault.name}</span>
                  {vault.is_default && <span className={styles.badge}>Default</span>}
                </button>
                {!vault.is_default && (
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVault(vault);
                    }}
                    title={t('vault.deleteVault')}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {vaults.length < 3 ? (
            <button
              className={styles.createBtn}
              onClick={() => setShowCreateModal(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t('vault.createVault')}
            </button>
          ) : (
            <div className={styles.limitNote}>{t('vault.maxReached')}</div>
          )}
        </div>
      )}

      {/* Create Vault Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>{t('vault.createVault')}</h3>
            <form onSubmit={handleCreateVault}>
              <input
                type="text"
                value={newVaultName}
                onChange={(e) => setNewVaultName(e.target.value)}
                placeholder={t('vault.vaultName')}
                autoFocus
              />
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
