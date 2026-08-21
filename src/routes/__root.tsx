import type { ReactNode } from "react";
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { Show, UserButton } from "@clerk/tanstack-react-start";
import appCss from "../styles/app.css?url";
import { Providers } from "~/components/Providers";
import { RegisterSW } from "~/components/RegisterSW";
import { SetupBanner } from "~/components/SetupBanner";
import { useI18n } from "~/lib/i18n";
import { hasClerk } from "~/env";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "Spark — Play your way closer." },
      {
        name: "description",
        content:
          "Spark is a couples game by JRNY: a playful board journey with conversation and connection prompts. What happens in a session stays on your phone.",
      },
      // Must match manifest.webmanifest theme_color
      { name: "theme-color", content: "#14101f" },
      // iOS ignores most of the manifest — these are the Safari fallbacks
      { name: "apple-mobile-web-app-capable", content: "yes" },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      { name: "apple-mobile-web-app-title", content: "Spark" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      // iOS reads this <link>, not the manifest icons (180×180 PNG)
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Providers>
        <Header />
        <Outlet />
        <RegisterSW />
        <SetupBanner />
      </Providers>
    </RootDocument>
  );
}

function Header() {
  const { t } = useI18n();
  return (
    <header className="flex items-center justify-between px-5 py-4">
      <Link to="/" className="font-display text-xl tracking-wide text-blush">
        Spark <span className="text-ember">✦</span>
      </Link>
      <nav className="flex items-center gap-4 text-sm text-mist">
        <Link to="/play/setup" className="hover:text-blush">
          {t("nav.play")}
        </Link>
        <Link to="/templates" className="hover:text-blush">
          {t("nav.templates")}
        </Link>
        <Link to="/settings" className="hover:text-blush">
          {t("nav.settings")}
        </Link>
        {hasClerk && (
          <Show when="signed-in">
            <UserButton />
          </Show>
        )}
      </nav>
    </header>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
