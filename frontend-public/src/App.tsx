import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import TestPage from './pages/TestPage';

function App() {
  console.log('App rendering with Layout');
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<TestPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
