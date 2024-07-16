import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import ProjectList from './components/ProjectList';
import AddProject from './components/AddProject';
import ProjectDetail from './components/ProjectDetails';
import ForceUpdateService from './components/ForceUpdateService';  // Import ForceUpdateService
import AddApplication from './components/AddApplication';  // Import AddApplication
import ManageRoles from './components/ManageRoles';  // Import ManageRoles
import theme from './theme';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/projects" element={<ProjectList />} />
                    <Route path="/projects/:projectId" element={<ProjectDetail />} />
                    <Route path="/add-project" element={<AddProject />} />
                    <Route path="/force-update" element={<ForceUpdateService />} />
                    <Route path="/add-application" element={<AddApplication />} />
                    <Route path="/manage-roles" element={<ManageRoles />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
