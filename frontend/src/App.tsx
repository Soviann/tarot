import { QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useCallback, useState } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { toast, Toaster } from "sonner";
import DoomSplash from "./components/DoomSplash";
import { ErrorFallback } from "./components/ErrorFallback";
import Layout from "./components/Layout";
import { useCheatCode } from "./hooks/useCheatCode";
import { useDoomSounds } from "./hooks/useDoomSounds";
import { useDoomTextNormalizer } from "./hooks/useDoomTextNormalizer";
import Home from "./pages/Home";
import { queryClient } from "./queryClient";

const GroupDetail = lazy(() => import("./pages/GroupDetail"));
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

function DoomEasterEgg() {
  const { setTheme } = useTheme();
  const { playActivation } = useDoomSounds();
  const [showSplash, setShowSplash] = useState(false);

  const handleActivate = useCallback(() => {
    setShowSplash(true);
    playActivation();
  }, [playActivation]);

  const handleSplashDone = useCallback(() => {
    setShowSplash(false);
    setTheme("doom");
    toast("GOD MODE ACTIVATED", {
      style: {
        background: "#1a0000",
        border: "1px solid #4a0000",
        color: "#ff4444",
        fontWeight: "bold",
      },
    });
  }, [setTheme]);

  useCheatCode("iddqd", handleActivate);
  useDoomTextNormalizer();

  return <DoomSplash onDone={handleSplashDone} visible={showSplash} />;
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const sonnerTheme = resolvedTheme === "doom" ? "dark" : (resolvedTheme as "dark" | "light");
  return <Toaster position="top-center" richColors theme={sonnerTheme} />;
}

export default function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => console.error("ErrorBoundary caught:", error, info)}
    >
      <ThemeProvider attribute="class" defaultTheme="system" storageKey="theme" themes={["light", "dark", "doom"]}>
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
                  <Route
                    path="/stats/player/:id"
                    element={<PlayerStats />}
                  />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
          <DoomEasterEgg />
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
