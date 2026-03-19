import { QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useCallback, useState } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { toast, Toaster } from "sonner";
import DoomHint from "./components/DoomHint";
import { ErrorFallback } from "./components/ErrorFallback";
import Layout from "./components/Layout";
import ThemeSplash from "./components/ThemeSplash";
import { useCheatCode } from "./hooks/useCheatCode";
import { useTextNormalizer } from "./hooks/useTextNormalizer";
import { useThemeSounds } from "./hooks/useThemeSounds";
import Home from "./pages/Home";
import { queryClient } from "./queryClient";
import { CUSTOM_THEME_NAMES, CUSTOM_THEMES, type ThemeConfig } from "./services/themeRegistry";

const GroupDetail = lazy(() => import("./pages/GroupDetail"));
const HeadToHead = lazy(() => import("./pages/HeadToHead"));
const Groups = lazy(() => import("./pages/Groups"));
const Help = lazy(() => import("./pages/Help"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Players = lazy(() => import("./pages/Players"));
const PlayerStats = lazy(() => import("./pages/PlayerStats"));
const SessionPage = lazy(() => import("./pages/SessionPage"));
const SessionSummary = lazy(() => import("./pages/SessionSummary"));
const Stats = lazy(() => import("./pages/Stats"));

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((mod) => ({
        default: mod.ReactQueryDevtools,
      })),
    )
  : () => null;

function ThemeCheatCodeHandler({ config }: { config: ThemeConfig }) {
  const { setTheme } = useTheme();
  const { playActivation } = useThemeSounds();
  const [showSplash, setShowSplash] = useState(false);

  const handleActivate = useCallback(() => {
    setShowSplash(true);
    playActivation(config.name);
  }, [config.name, playActivation]);

  const handleSplashDone = useCallback(() => {
    setShowSplash(false);
    setTheme(config.name);
    toast(config.toastMessage, { style: config.toastStyle });
  }, [config, setTheme]);

  useCheatCode(config.triggerNames, handleActivate);

  return <ThemeSplash imageSrc={config.splashImage} onDone={handleSplashDone} visible={showSplash} />;
}

function ThemeEasterEgg() {
  useTextNormalizer();

  return (
    <>
      {Object.values(CUSTOM_THEMES).map((config) => (
        <ThemeCheatCodeHandler config={config} key={config.name} />
      ))}
    </>
  );
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const themeConfig = resolvedTheme ? CUSTOM_THEMES[resolvedTheme] : undefined;
  const sonnerTheme = themeConfig?.sonnerTheme ?? (resolvedTheme as "dark" | "light");
  return <Toaster position="top-center" richColors theme={sonnerTheme} />;
}

export default function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => console.error("ErrorBoundary caught:", error, info)}
    >
      <ThemeProvider attribute="class" defaultTheme="system" storageKey="theme" themes={["light", "dark", ...CUSTOM_THEME_NAMES]}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Suspense>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/aide" element={<Help />} />
                  <Route path="/groups" element={<Groups />} />
                  <Route path="/groups/:id" element={<GroupDetail />} />
                  <Route path="/players" element={<Players />} />
                  <Route
                    path="/sessions/:id/summary"
                    element={<SessionSummary />}
                  />
                  <Route
                    path="/sessions/:id"
                    element={<SessionPage />}
                  />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/stats/h2h" element={<HeadToHead />} />
                  <Route
                    path="/stats/player/:id"
                    element={<PlayerStats />}
                  />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
          <DoomHint />
          <ThemeEasterEgg />
          <ThemedToaster />
          {import.meta.env.DEV && (
            <Suspense>
              <ReactQueryDevtools initialIsOpen={false} />
            </Suspense>
          )}
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
