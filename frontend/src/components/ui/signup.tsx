import { Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlashPayBrand } from "@/components/slash-pay-brand";
import {
  isBackendConfigured,
  loginWithBackend,
  registerWithBackend,
} from "@/lib/backend-api";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!supabase && !isBackendConfigured()) {
      setError("Authentication is not configured yet.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (isBackendConfigured() && (!firstName.trim() || !/^[a-z]{2}$/i.test(country.trim()))) {
      setError("Enter your first name and a two-letter country code, such as IN or US.");
      return;
    }
    setLoading(true);
    if (isBackendConfigured()) {
      try {
        await registerWithBackend({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          country: country.trim().toUpperCase(),
        });
        await loginWithBackend(email.trim(), password);
        navigate({ to: "/dashboard" });
      } catch (signupError) {
        setError(
          signupError instanceof Error
            ? signupError.message
            : "Unable to create your account.",
        );
      } finally {
        setLoading(false);
      }
      return;
    }
    const { data, error: signupError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (signupError) {
      setError(signupError.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/dashboard" });
      return;
    }
    setMessage(
      "Account created. Check your email to confirm your account, then sign in.",
    );
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
          <h1 className="mt-8 text-2xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:opacity-80"
            >
              Sign in
            </Link>
          </p>
          <form className="mt-8 space-y-5" onSubmit={submit}>
            {isBackendConfigured() && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="signup-first-name">First name</Label>
                  <Input
                    id="signup-first-name"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-last-name">Last name</Label>
                  <Input
                    id="signup-last-name"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-country">Country code</Label>
                  <Input
                    id="signup-country"
                    autoComplete="country"
                    placeholder="IN"
                    value={country}
                    onChange={(event) => setCountry(event.target.value.toUpperCase())}
                    maxLength={2}
                    required
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password">Confirm password</Label>
              <Input
                id="signup-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button
              disabled={loading}
              type="submit"
              className="h-11 w-full font-medium"
            >
              {loading ? "Creating account…" : "Create account"}
            </Button>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-green-700" role="status">
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
