"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * localStorage 문자열 구독 훅 — SSR 안전(서버 스냅샷 = fallback),
 * 같은 키를 쓰는 컴포넌트·탭 간 동기화 지원.
 * effect 안 setState 없이 하이드레이션 후 자동으로 클라이언트 값으로 갱신된다.
 */

const listeners = new Set<() => void>();
const emit = () => {
  for (const l of listeners) l();
};

export function useLocalStorageString(key: string, fallback: string) {
  const subscribe = useCallback(
    (cb: () => void) => {
      listeners.add(cb);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) cb();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }, [key, fallback]);

  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (v: string) => {
      try {
        localStorage.setItem(key, v);
      } catch {
        /* 저장 불가(시크릿 모드 등) 시 무시 */
      }
      emit();
    },
    [key],
  );

  return [value, setValue] as const;
}
