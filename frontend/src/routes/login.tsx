import { Link, createFileRoute } from "@tanstack/react-router";
import { LockKeyhole, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { SlashPayBrand } from "@/components/slash-pay-brand";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in | Slash Pay" },
      {
        name: "description",
        content: "Log in to your Slash Pay account.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [revealed, setRevealed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setRevealed(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className="login-page">
      <section
        className={`login-shell ${revealed ? "is-revealed" : ""}`}
        aria-label="Slash Pay login"
      >
        <div className="login-curtain" aria-hidden="true">
          <span className="login-curtain__mark">➤</span>
        </div>

        <div className="login-panel">
          <Link
            to="/"
            className="login-brand"
            aria-label="Back to Slash Pay home"
          >
            <SlashPayBrand />
          </Link>

          <div className="login-form-wrap">
            <div className="login-heading">
              <h1>Log in to your account.</h1>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <label className="login-field" aria-label="Email address">
                <span className="login-input-wrap">
                  <UserRound aria-hidden="true" size={17} />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder=""
                    required
                  />
                </span>
              </label>

              <label className="login-field" aria-label="Password">
                <span className="login-input-wrap">
                  <LockKeyhole aria-hidden="true" size={18} />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder=""
                    required
                  />
                </span>
              </label>

              <div className="login-options">
                <label className="login-check">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button className="login-submit" type="submit">
                Log in now
              </button>

              <p className="login-recovery">
                Forgot password? <button type="button">Reset password</button>
              </p>
            </form>
          </div>

          <div className="login-footer">
            <span className="login-footer__active">
              <UserRound aria-hidden="true" size={14} /> Log in
            </span>
            <button type="button">
              <LockKeyhole aria-hidden="true" size={14} /> Sign up
            </button>
          </div>
        </div>
        <div className="login-blank" aria-hidden="true" />
      </section>
    </main>
  );
}
