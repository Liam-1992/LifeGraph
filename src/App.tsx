/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Metrics } from './pages/Metrics';
import { Habits } from './pages/Habits';
import { Goals } from './pages/Goals';
import { Graph } from './pages/Graph';
import { Login } from './pages/Login';
import { Resources } from './pages/Resources';
import { Notes } from './pages/Notes';
import { Journal } from './pages/Journal';
import { Categories } from './pages/Categories';
import { AICoach } from './pages/AICoach';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="metrics" element={<Metrics />} />
          <Route path="categories" element={<Categories />} />
          <Route path="habits" element={<Habits />} />
          <Route path="goals" element={<Goals />} />
          <Route path="resources" element={<Resources />} />
          <Route path="notes" element={<Notes />} />
          <Route path="journal" element={<Journal />} />
          <Route path="graph" element={<Graph />} />
          <Route path="ai-coach" element={<AICoach />} />
        </Route>
      </Routes>
    </Router>
  );
}
