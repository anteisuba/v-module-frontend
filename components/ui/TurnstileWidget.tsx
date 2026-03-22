// components/ui/TurnstileWidget.tsx
"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { forwardRef, useImperativeHandle, useRef } from "react";

export interface TurnstileWidgetRef {
  reset: () => void;
  getToken: () => string | undefined;
}

interface TurnstileWidgetProps {
  onSuccess?: (token: string) => void;
  onError?: () => void;
}

const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  function TurnstileWidget({ onSuccess, onError }, ref) {
    const turnstileRef = useRef<TurnstileInstance | null>(null);
    const tokenRef = useRef<string | undefined>(undefined);

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    useImperativeHandle(ref, () => ({
      reset: () => {
        tokenRef.current = undefined;
        turnstileRef.current?.reset();
      },
      getToken: () => tokenRef.current,
    }));

    // 开发环境没有 site key 时跳过
    if (!siteKey) {
      return null;
    }

    return (
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        options={{ size: "invisible" }}
        onSuccess={(token: string) => {
          tokenRef.current = token;
          onSuccess?.(token);
        }}
        onError={() => {
          tokenRef.current = undefined;
          onError?.();
        }}
      />
    );
  }
);

export default TurnstileWidget;
