import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/SidebarLayout";
import HomePage from "./pages/Home";
import { ThemeProvider } from "./utils/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Login from "./pages/Login";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Router>
          <Routes>
            <Route path="/auth/login" element={<Login />} />
            <Route path="/dashboard" element={<Layout />}>
              <Route index element={<HomePage />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
