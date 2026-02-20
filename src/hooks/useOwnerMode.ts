/**
 * 站长模式：仅站长可见「生成年度总结」等敏感操作
 * 通过 ?owner=1 或 ?owner=密钥 启用，或输入密钥后启用
 */
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'year-review-owner';

function getOwnerKey(): string {
  return (import.meta.env.VITE_YEAR_REVIEW_OWNER_KEY as string)?.trim() || '1';
}

/** 检查 URL 中的 owner 参数，若匹配则启用并写入 localStorage */
function checkUrlParam(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const ownerParam = params.get('owner');
  if (!ownerParam) return false;
  const key = getOwnerKey();
  if (ownerParam === key) {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function useOwnerMode(): {
  isOwner: boolean;
  unlock: (inputKey: string) => boolean;
  lock: () => void;
  showUnlockModal: boolean;
  setShowUnlockModal: (v: boolean) => void;
} {
  const [isOwner, setIsOwner] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  useEffect(() => {
    let flag = false;
    try {
      flag = localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {}
    if (!flag) flag = checkUrlParam();
    setIsOwner(flag);
  }, []);

  const unlock = useCallback((inputKey: string): boolean => {
    const key = getOwnerKey();
    if (inputKey.trim() === key) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsOwner(true);
        setShowUnlockModal(false);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  const lock = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setIsOwner(false);
    } catch {}
  }, []);

  return { isOwner, unlock, lock, showUnlockModal, setShowUnlockModal };
}
