import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Research from './pages/Research'
import People from './pages/People'
import Publications from './pages/Publications'
import Outreach from './pages/Outreach'
import PublicationsNetworkHero from './pages/PublicationsNetworkHero'
import ScrollToTop from './components/ScrollToTop'

function App() {
  return (
    <Router basename="/gongoracastillolab">
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/research" element={<Research />} />
          <Route path="/people" element={<People />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/outreach" element={<Outreach />} />
          <Route path="/publications-network-hero" element={<PublicationsNetworkHero />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
