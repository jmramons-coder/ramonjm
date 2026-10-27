"use client";

import type { UILanguage } from "@/lib/ui/language";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import localFont from "next/font/local";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import travelCoast from "../../public/auth-coast.webp";
import ShaderOrb from "./ShaderOrb";
import styles from "./AuthPage.module.css";

const wordmarkFont = localFont({
  src: "../fonts/Inter-SemiBold-v4.1.woff2",
  weight: "600",
  style: "normal",
  display: "swap",
  preload: false,
});

export type AuthMode = "sign-in" | "sign-up" | "reset-request" | "update-password";

export interface AuthPageProps {
  language: UILanguage;
  mode: AuthMode;
  email: string;
  password: string;
  confirmPassword: string;
  loading: boolean;
  googleEnabled?: boolean;
  error: string | null;
  notice: string | null;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onGoogle: () => void;
  onBack: () => void;
}

const COPY = {
  fr: {
    back: "Retour à l’accueil",
    brand: "aBeam, votre copilote voyage",
    visualLabel: "Pensé pour les conseillers en voyage",
    visualTitle: "Le prochain voyage commence par une conversation.",
    visualText: "Écoutez vos clients. Retrouvez les détails. Préparez la suite.",
    email: "Courriel professionnel",
    password: "Mot de passe",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    forgot: "Mot de passe oublié ?",
    google: "Continuer avec Google",
    alternative: "ou avec votre courriel",
    passwordHint: "Au moins 8 caractères.",
    noAccount: "Vous découvrez aBeam ?",
    signUp: "Créer un compte",
    hasAccount: "Vous avez déjà un compte ?",
    signIn: "Se connecter",
    returnToSignIn: "Revenir à la connexion",
    modes: {
      "sign-in": { title: "Ravi de vous retrouver.", text: "Connectez-vous à votre espace voyage.", submit: "Se connecter", busy: "Connexion…" },
      "sign-up": { title: "Bienvenue chez aBeam.", text: "Créez votre espace pour vos prochaines conversations.", submit: "Créer un compte", busy: "Création du compte…" },
      "reset-request": { title: "Mot de passe oublié ?", text: "Indiquez votre courriel pour recevoir un lien de réinitialisation.", submit: "Envoyer le lien", busy: "Envoi du lien…" },
      "update-password": { title: "Nouveau mot de passe", text: "Choisissez un nouveau mot de passe pour votre compte.", submit: "Enregistrer le mot de passe", busy: "Enregistrement…" },
    },
  },
  en: {
    back: "Back to home",
    brand: "aBeam, your travel copilot",
    visualLabel: "Made for travel advisors",
    visualTitle: "The next journey starts with a conversation.",
    visualText: "Listen to your clients. Keep the details. Prepare what’s next.",
    email: "Work email",
    password: "Password",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    forgot: "Forgot password?",
    google: "Continue with Google",
    alternative: "or with your email",
    passwordHint: "At least 8 characters.",
    noAccount: "New to aBeam?",
    signUp: "Create an account",
    hasAccount: "Already have an account?",
    signIn: "Sign in",
    returnToSignIn: "Back to sign in",
    modes: {
      "sign-in": { title: "Welcome back.", text: "Sign in to your travel workspace.", submit: "Sign in", busy: "Signing in…" },
      "sign-up": { title: "Welcome to aBeam.", text: "Create your workspace for the conversations ahead.", submit: "Create an account", busy: "Creating your account…" },
      "reset-request": { title: "Forgot your password?", text: "Enter your email and we’ll send you a reset link.", submit: "Send reset link", busy: "Sending the link…" },
      "update-password": { title: "Set a new password", text: "Choose a new password for your account.", submit: "Save new password", busy: "Saving…" },
    },
  },
} as const;

function PasswordField({
  id, label, value, onChange, autoComplete, minLength, hintId, errorId, language, disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  hintId?: string;
  errorId?: string;
  language: UILanguage;
  disabled: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const copy = COPY[language];
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.passwordInput}>
        <input
          id={id}
          name={id.includes("confirm-password") ? "confirm-password" : "password"}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          minLength={minLength}
          required
          disabled={disabled}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          aria-label={visible ? copy.hidePassword : copy.showPassword}
          aria-pressed={visible}
          aria-controls={id}
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.6Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.5l-3.3-2.6c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3v2.7A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.7a6 6 0 0 1 0-3.4V7.6H3a10 10 0 0 0 0 8.8l3.4-2.7Z" />
      <path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.6l3.4 2.7c.8-2.4 3-4.2 5.6-4.2Z" />
    </svg>
  );
}

export default function AuthPage({
  language, mode, email, password, confirmPassword, loading, googleEnabled = false,
  error, notice, onModeChange, onEmailChange, onPasswordChange,
  onConfirmPasswordChange, onSubmit, onGoogle, onBack,
}: AuthPageProps) {
  const id = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousMode = useRef(mode);
  useEffect(() => {
    if (previousMode.current !== mode) {
      previousMode.current = mode;
      titleRef.current?.focus({ preventScroll: true });
    }
  }, [mode]);
  const copy = COPY[language];
  const screen = copy.modes[mode];
  const accountMode = mode === "sign-in" || mode === "sign-up";
  const newPassword = mode === "sign-up" || mode === "update-password";
  const errorId = error ? `${id}-error` : undefined;
  return (
    <main className={styles.page} lang={language}>
      <div className={styles.layout}>
        <aside className={styles.visual} aria-label={copy.visualLabel}>
          <Image
            className={styles.photo}
            src={travelCoast}
            alt=""
            fill
            loading="eager"
            quality={100}
            sizes="(max-width: 800px) 1px, (max-width: 1100px) calc(50vw - 52px), (max-width: 1216px) calc(50vw - 68px), 540px"
            placeholder="blur"
          />
          <div className={styles.visualLight} aria-hidden="true" />
          <div className={styles.visualDither} aria-hidden="true" />
          <div className={styles.visualContent}>
            <p className={styles.visualLabel}>{copy.visualLabel}</p>
            <h2>{copy.visualTitle}</h2>
            <p className={styles.visualText}>{copy.visualText}</p>
          </div>
        </aside>
        <section className={styles.signIn} aria-labelledby={`${id}-title`}>
          <button type="button" className={styles.back} onClick={onBack} disabled={loading}>
            <ArrowLeft size={15} aria-hidden="true" />
            <span>{copy.back}</span>
          </button>
          <div className={styles.formContent}>
            <div className={styles.brand} aria-label={copy.brand}>
              <ShaderOrb edge="smooth" tone="blue" animated className={styles.brandOrb} />
              <span className={wordmarkFont.className}>aBeam</span>
            </div>
            <header className={styles.heading}>
              <h1 id={`${id}-title`} ref={titleRef} tabIndex={-1}>{screen.title}</h1>
              <p>{screen.text}</p>
            </header>
            {accountMode && googleEnabled && (
              <div className={styles.social}>
                <button className={styles.google} type="button" onClick={onGoogle} disabled={loading}>
                  <GoogleMark />
                  <span>{copy.google}</span>
                </button>
                <div className={styles.alternative}><span>{copy.alternative}</span></div>
              </div>
            )}
            <form className={styles.form} onSubmit={onSubmit} aria-busy={loading}>
              {mode !== "update-password" && (
                <div className={styles.field}>
                  <label htmlFor={`${id}-email`}>{copy.email}</label>
                  <input
                    id={`${id}-email`}
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder={language === "fr" ? "vous@agence.com" : "you@agency.com"}
                    value={email}
                    required
                    disabled={loading}
                    aria-describedby={errorId}
                    onChange={(event) => onEmailChange(event.target.value)}
                  />
                </div>
              )}
              {mode !== "reset-request" && (
                <div className={styles.passwordField}>
                  <PasswordField
                    key={`${mode}-password`}
                    id={`${id}-password`}
                    label={mode === "update-password" ? copy.newPassword : copy.password}
                    value={password}
                    onChange={onPasswordChange}
                    autoComplete={newPassword ? "new-password" : "current-password"}
                    minLength={newPassword ? 8 : undefined}
                    hintId={newPassword ? `${id}-password-hint` : undefined}
                    errorId={errorId}
                    language={language}
                    disabled={loading}
                  />
                  {newPassword && <p className={styles.fieldHint} id={`${id}-password-hint`}>{copy.passwordHint}</p>}
                  {mode === "sign-in" && (
                    <button type="button" className={styles.forgot} disabled={loading} onClick={() => onModeChange("reset-request")}>{copy.forgot}</button>
                  )}
                </div>
              )}
              {mode === "update-password" && (
                <PasswordField
                  key="confirm-password"
                  id={`${id}-confirm-password`}
                  label={copy.confirmPassword}
                  value={confirmPassword}
                  onChange={onConfirmPasswordChange}
                  autoComplete="new-password"
                  minLength={8}
                  errorId={errorId}
                  language={language}
                  disabled={loading}
                />
              )}
              {error && <p className={styles.error} id={errorId} role="alert">{error}</p>}
              {notice && <p className={styles.notice} role="status">{notice}</p>}
              <button type="submit" className={styles.submit} disabled={loading}>
                <span>{loading ? screen.busy : screen.submit}</span>
                {loading ? <LoaderCircle className={styles.spinner} size={17} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
              </button>
            </form>
            <div className={styles.modeSwitch}>
              {accountMode ? (
                <>
                  <span>{mode === "sign-in" ? copy.noAccount : copy.hasAccount}</span>
                  <button type="button" disabled={loading} onClick={() => onModeChange(mode === "sign-in" ? "sign-up" : "sign-in")}>
                    {mode === "sign-in" ? copy.signUp : copy.signIn}
                  </button>
                </>
              ) : (
                <button type="button" disabled={loading} onClick={() => onModeChange("sign-in")}><ArrowLeft size={14} aria-hidden="true" />{copy.returnToSignIn}</button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
