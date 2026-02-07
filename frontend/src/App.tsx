import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { ThemeProvider } from "./hooks/useTheme";
import Home from "./pages/Home";
import Players from "./pages/Players";
import PlayerStats from "./pages/PlayerStats";
import SessionPage from "./pages/SessionPage";
import Stats from "./pages/Stats";

const queryClient = new QueryClient();

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/players" element={<Players />} />
              <Route path="/sessions/:id" element={<SessionPage />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/stats/player/:id" element={<PlayerStats />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
