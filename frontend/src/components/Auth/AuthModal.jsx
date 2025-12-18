/**
 * AuthModal - Login/Register modal component
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store';
import styles from './Auth.module.css';

export function AuthModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const { login, register, loginAsGuest, isLoading, error, clearError } = useAuthStore();

  // Clear form on mode change
  useEffect(() => {
    setFormData({ email: '', username: '', password: '', confirmPassword: '' });
    setErrors({});
    clearError();
  }, [mode, clearError]);

  // Clear errors when modal closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      clearError();
    }
  }, [isOpen, clearError]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = t('auth.errors.invalidEmail');
    }

    // Password validation
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = t('auth.errors.shortPassword');
    }

    // Registration-specific validations
    if (mode === 'register') {
      if (!formData.username || formData.username.length < 3) {
        newErrors.username = t('auth.errors.shortUsername');
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('auth.errors.passwordMismatch');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, mode, t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear specific error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    let result;
    if (mode === 'login') {
      result = await login(formData.email, formData.password);
    } else {
      result = await register(formData.email, formData.username, formData.password);
    }

    if (result.success) {
      onClose();
    }
  };

  const handleGuestLogin = async () => {
    clearError();
    const result = await loginAsGuest();
    if (result.success) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} onKeyDown={handleKeyDown}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span>OdyssVault</span>
          </div>
          <h2>{mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          {/* Username (register only) */}
          {mode === 'register' && (
            <div className={styles.field}>
              <label htmlFor="username">{t('auth.username')}</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="username"
                autoComplete="username"
              />
              {errors.username && <span className={styles.error}>{errors.username}</span>}
            </div>
          )}

          {/* Password */}
          <div className={styles.field}>
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </div>

          {/* Confirm Password (register only) */}
          {mode === 'register' && (
            <div className={styles.field}>
              <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
            </div>
          )}

          {/* API Error */}
          {error && <div className={styles.apiError}>{error}</div>}

          {/* Submit Button */}
          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? (
              <span className={styles.spinner}></span>
            ) : (
              mode === 'login' ? t('auth.login') : t('auth.register')
            )}
          </button>
        </form>

        {/* Divider */}
        <div className={styles.divider}>
          <span>{t('auth.orDivider')}</span>
        </div>

        {/* Guest Login */}
        <button
          type="button"
          className={styles.guestBtn}
          onClick={handleGuestLogin}
          disabled={isLoading}
        >
          {t('auth.continueAsGuest')}
        </button>
        <p className={styles.guestNote}>{t('auth.guestNote')}</p>

        {/* Mode Switch */}
        <div className={styles.modeSwitch}>
          {mode === 'login' ? (
            <p>
              {t('auth.noAccount')}{' '}
              <button type="button" onClick={() => setMode('register')}>
                {t('auth.register')}
              </button>
            </p>
          ) : (
            <p>
              {t('auth.hasAccount')}{' '}
              <button type="button" onClick={() => setMode('login')}>
                {t('auth.login')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
