import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/SidebarLayout'
import HomePage from './pages/Home'
import { ThemeProvider } from './utils/ThemeProvider'

function App() {
  return (
    <ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App