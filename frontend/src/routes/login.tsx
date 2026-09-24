import { createFileRoute } from "@tanstack/react-router";
import Login2 from "@/components/ui/login-2";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in | Slash Pay" },
      { name: "description", content: "Log in to your Slash Pay account." },
    ],
  }),
  component: Login2,
});
