import LoginPage from './pages/LoginPage'; 
import { Navigate, Routes, Route } from 'react-router-dom';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import TeamCalendar from './pages/TeamCalendar';
import HrDashboard from './pages/HrDashboard';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/dashboard" element={<EmployeeDashboard />} />
      <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
      <Route path="/manager-dashboard" element={<ManagerDashboard />} />
      <Route path="/team-calendar" element={<TeamCalendar />} />
      <Route path="/hr-dashboard" element={<HrDashboard />} />
    </Routes>
  );
};

export default App;
