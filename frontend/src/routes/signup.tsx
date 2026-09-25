import { createFileRoute } from "@tanstack/react-router";
import Signup from "@/components/ui/signup";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up | Slash Pay" },
      { name: "description", content: "Create your Slash Pay account." },
    ],
  }),
  component: Signup,
});
