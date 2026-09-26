import { Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SlashPayBrand } from "@/components/slash-pay-brand";
import googleLogo from "@/assets/google-logo-v2.webp";
import { isBackendConfigured, loginWithBackend } from "@/lib/backend-api";
import { supabase } from "@/lib/supabase";

const GoogleIcon = () => (
  <span
    className="relative block h-7 w-7 shrink-0 overflow-hidden"
    aria-hidden="true"
  >
    <img
      src={googleLogo}
      alt=""
      className="absolute -left-3.5 -top-0.5 h-7 max-w-none mix-blend-multiply brightness-[1.25] contrast-[1.15]"
    />
  </span>
);

export default function Login2() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  async function signIn(provider: "password" | "google") {
    setError("");
    setLoading(true);
    if (provider === "password" && isBackendConfigured()) {
      try {
        await loginWithBackend(email.trim(), password);
        navigate({ to: "/dashboard" });
      } catch (loginError) {
        setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (provider === "google" && isBackendConfigured()) {
      setError("Google sign-in is not available for the local backend yet.");
      setLoading(false);
      return;
    }
    if (!supabase) {
      setError(
        "Authentication is not configured yet. Add the Supabase environment variables.",
      );
      setLoading(false);
      return;
    }
    const result =
      provider === "google"
        ? await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/dashboard` },
          })
        : await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }
    if (provider === "password") navigate({ to: "/dashboard" });
    setLoading(false);
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void signIn("password");
  }
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col justify-center px-6 py-10 lg:px-10">
        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            className="inline-block w-40"
            aria-label="Back to Slash Pay home"
          >
            <SlashPayBrand />
          </Link>
          <h1 className="mt-8 text-2xl font-semibold">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-primary hover:opacity-80"
            >
              Sign up
            </Link>
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => void signIn("google")}
              className="!h-12 !min-h-12 !w-full !max-w-md !gap-3 !rounded-full !px-6 !text-base"
              style={{
                height: 48,
                minHeight: 48,
                maxHeight: 48,
                fontSize: 16,
                lineHeight: "20px",
              }}
              type="button"
            >
              <GoogleIcon />
              {loading ? "Signing in…" : "Login with Google"}
            </Button>
          </div>
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs uppercase text-muted-foreground">
                or
              </span>
            </div>
          </div>
          <form className="space-y-5" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="ephraim@blocks.so"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button
              disabled={loading}
              type="submit"
              className="mt-2 h-11 w-full font-medium"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </form>
          <p className="mt-6 text-sm text-muted-foreground">
            Forgot your password?{" "}
            <button
              className="font-medium text-primary hover:opacity-80"
              type="button"
            >
              Reset password
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
