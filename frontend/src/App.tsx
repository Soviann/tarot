import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import { ThemeProvider } from "./hooks/useTheme";
import { ToastProvider } from "./hooks/useToast";
import Home from "./pages/Home";
import ToastContainer from "./components/ui/ToastContainer";

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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
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
            <ToastContainer />
          </ToastProvider>
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
