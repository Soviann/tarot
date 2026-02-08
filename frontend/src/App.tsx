import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { ThemeProvider } from "./hooks/useTheme";
import Help from "./pages/Help";
import Home from "./pages/Home";
import Players from "./pages/Players";
import PlayerStats from "./pages/PlayerStats";
import SessionPage from "./pages/SessionPage";
import Stats from "./pages/Stats";

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((mod) => ({
        default: mod.ReactQueryDevtools,
      })),
    )
  : () => null;

const queryClient = new QueryClient();

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/aide" element={<Help />} />
              <Route path="/players" element={<Players />} />
              <Route path="/sessions/:id" element={<SessionPage />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/stats/player/:id" element={<PlayerStats />} />
            </Route>
          </Routes>
        </BrowserRouter>
        {import.meta.env.DEV && (
          <Suspense>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
