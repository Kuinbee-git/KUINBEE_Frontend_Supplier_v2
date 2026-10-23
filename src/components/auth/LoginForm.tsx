"use client";

import React, {
  useState,
  useCallback,
  useSyncExternalStore,
  memo,
} from "react";
import {
  DashboardField,
  DashboardInput,
} from "@/components/dashboard/ui/dashboard-form";
import { DashboardButton } from "@/components/dashboard/ui/dashboard-button";
import { useAuthTokens } from "@/hooks/useAuthTokens";
import { AuthHeader, AuthButton, AuthAlert, PasswordInput } from "./shared";

interface LoginFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: (email: string, password: string) => void;
  onCreateAccount: () => void;
  onForgotPassword: () => void;
  isDark?: boolean;
  error?: string;
}

const subscribeToHydration = () => () => {};
const clientIsReady = () => true;
const serverIsReady = () => false;

function LoginFormComponent({
  email,
  onEmailChange,
  onSubmit,
  onCreateAccount,
  onForgotPassword,
  isDark = false,
  error: externalError,
}: LoginFormProps) {
  const isReady = useSyncExternalStore(
    subscribeToHydration,
    clientIsReady,
    serverIsReady
  );
  const [localEmail, setLocalEmail] = useState(email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const tokens = useAuthTokens(isDark);

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalEmail(value);
      onEmailChange(value);
    },
    [onEmailChange]
  );

  const handleSubmit = useCallback(() => {
    setError("");

    if (!localEmail) {
      setError("Please enter your email address");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      return;
    }

    onSubmit(localEmail, password);
  }, [localEmail, password, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <fieldset className="min-w-0 space-y-5" disabled={!isReady}>
      <AuthHeader
        title="Sign in to your account"
        subtitle="Access your supplier workspace."
        tokens={tokens}
      />

      <DashboardField id="email" label="Email">
        {(control) => (
          <DashboardInput
            {...control}
            type="email"
            placeholder="your@company.com"
            value={localEmail}
            onChange={handleEmailChange}
            onKeyDown={handleKeyDown}
            autoFocus
            autoComplete="email"
          />
        )}
      </DashboardField>

      {/* Password field */}
      <PasswordInput
        id="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={handleKeyDown}
        tokens={tokens}
      />

      {/* Error message */}
      {(error || externalError) && (
        <AuthAlert
          message={error || externalError || ""}
          variant="error"
          isDark={isDark}
          tokens={tokens}
        />
      )}

      <AuthButton onClick={handleSubmit} isDark={isDark}>
        Sign in
      </AuthButton>
      <div className="grid gap-1">
        <DashboardButton variant="ghost" onClick={onForgotPassword}>
          Forgot password?
        </DashboardButton>
        <DashboardButton variant="ghost" onClick={onCreateAccount}>
          New supplier? Apply to join
        </DashboardButton>
      </div>
    </fieldset>
  );
}

export const LoginForm = memo(LoginFormComponent);
export default LoginForm;
