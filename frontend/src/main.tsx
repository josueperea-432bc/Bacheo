import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import AdminPage from './pages/AdminPage.tsx';
import CuadrillaPage from './pages/CuadrillaPage.tsx';
import PersonalPage from './pages/PersonalPage.tsx';
import RevisorPage from './pages/RevisorPage.tsx';

createRoot(
  document.getElementById('root')!,
).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<App />}
        />

        <Route
          path="/personal"
          element={<PersonalPage />}
        />

        <Route
          path="/admin"
          element={<AdminPage />}
        />

        <Route
          path="/revisor"
          element={<RevisorPage />}
        />

        <Route
          path="/cuadrilla"
          element={<CuadrillaPage />}
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
