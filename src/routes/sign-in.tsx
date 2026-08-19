import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/tanstack-react-start";
import { hasClerk } from "~/env";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  if (!hasClerk) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center text-mist">
        <p className="text-3xl">🔧</p>
        <p className="mt-4">
          Sign-in isn't configured yet (demo mode). Add Clerk keys to
          <code className="mx-1 rounded bg-plum px-1.5 py-0.5 text-xs">.env.local</code>
          — see the README.
        </p>
      </main>
    );
  }
  return (
    <main className="flex justify-center px-6 py-10">
      <SignIn />
    </main>
  );
}
