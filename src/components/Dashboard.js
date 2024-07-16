import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Drawer, List, ListItem, ListItemText, Menu, MenuItem, Divider } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { auth, firestore } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import ForceUpdateService from './ForceUpdateService';
import AddApplication from './AddApplication';
import ManageRoles from './ManageRoles';
import ProjectList from './ProjectList';
import AddProject from './AddProject';
import ProjectDetail from './ProjectDetails';

const drawerWidth = 240;

const Dashboard = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [userRole, setUserRole] = useState('guest');
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState('');
    const [assignedProjects, setAssignedProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    useEffect(() => {
        const fetchUserRole = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(firestore, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const role = userDoc.data().role;
                    setUserRole(role);
                    console.log('User role:', role);

                    let projectsRef;
                    if (role === 'Developer') {
                        projectsRef = collection(firestore, 'projects');
                        const q = query(projectsRef, where('developers', 'array-contains', user.email));
                        const querySnapshot = await getDocs(q);
                        const projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setAssignedProjects(projects);
                        console.log('Assigned projects for developer:', projects);
                    } else if (role === 'Team Lead') {
                        projectsRef = collection(firestore, 'projects');
                        const q = query(projectsRef, where('currentPhase', '!=', 'BA Phase'));
                        const querySnapshot = await getDocs(q);
                        const projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setAssignedProjects(projects);
                        console.log('Projects for Team Lead:', projects);
                    } else if (role === 'Admin' || role === 'Business Analyst' || role === 'Super Admin') {
                        projectsRef = collection(firestore, 'projects');
                        const querySnapshot = await getDocs(projectsRef);
                        const projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setAssignedProjects(projects);
                        console.log('All projects for admin/BA/Super Admin:', projects);
                    }
                }
            } else {
                window.location.href = '/'; // Redirect to login if not authenticated
            }
            setLoading(false);
        };

        const unsubscribe = onAuthStateChanged(auth, fetchUserRole);
        return () => unsubscribe();
    }, []);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleProjectSelect = (projectId) => {
        setSelectedProjectId(projectId);
        setSelectedService('ProjectDetail');
    };

    const renderService = () => {
        switch (selectedService) {
            case 'Force Update Service':
                return <ForceUpdateService />;
            case 'Add Application':
                return <AddApplication />;
            case 'Manage Roles':
                return <ManageRoles />;
            case 'Projects':
                return <ProjectList projects={assignedProjects} onProjectSelect={handleProjectSelect} />;
            case 'Add Project':
                return <AddProject />;
            case 'ProjectDetail':
                return selectedProjectId ? <ProjectDetail projectId={selectedProjectId} /> : <Typography variant="h6">Select a project to view details.</Typography>;
            default:
                return <Typography variant="h6">Select a service from the left panel.</Typography>;
        }
    };

    const renderFeatures = () => {
        if (userRole === 'guest') {
            return <Typography variant="h6">You do not have access to this section.</Typography>;
        }

        const commonServices = [
            { label: 'Force Update Service', component: 'Force Update Service' },
            { label: 'Add Application', component: 'Add Application' },
        ];

        return (
            <List>
                {commonServices.map(service => (
                    <ListItem button key={service.component} onClick={() => setSelectedService(service.component)}>
                        <ListItemText primary={service.label} />
                    </ListItem>
                ))}
                {(userRole === 'Admin' || userRole === 'Business Analyst' || userRole === 'Team Lead' || userRole === 'Developer') && (
                    <ListItem button onClick={() => setSelectedService('Projects')}>
                        <ListItemText primary="Projects" />
                    </ListItem>
                )}
                {(userRole === 'Admin' || userRole === 'Business Analyst') && (
                    <ListItem button onClick={() => setSelectedService('Add Project')}>
                        <ListItemText primary="Add Project" />
                    </ListItem>
                )}
                {userRole === 'Super Admin' && (
                    <ListItem button onClick={() => setSelectedService('Manage Roles')}>
                        <ListItemText primary="Manage Roles" />
                    </ListItem>
                )}
            </List>
        );
    };

    if (loading) {
        return <Typography variant="h6">Loading...</Typography>;
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', padding: 2 }}>
                    <img src="https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/2d/a0/60/2da060b1-ceb3-f8c7-f7fb-b8ee5565e74e/AppIcon-1x_U007emarketing-0-7-0-sRGB-85-220-0.png/460x0w.webp" alt="Company Logo" style={{ width: '40px', marginRight: '10px' }} />
                    <Typography variant="h6">Al Mulla Exchange</Typography>
                </Box>
                <Divider />
                <Box sx={{ overflow: 'auto' }}>
                    {renderFeatures()}
                </Box>
            </Drawer>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    p: 3,
                    width: `calc(100% - ${drawerWidth}px)`,
                }}
            >
                <AppBar position="fixed" sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}>
                    <Toolbar>
                        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                            Dashboard
                        </Typography>
                        <div>
                            <IconButton
                                edge="end"
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleMenu}
                                color="inherit"
                            >
                                <AccountCircle />
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                <MenuItem onClick={handleClose}>Profile</MenuItem>
                                <MenuItem onClick={handleClose}>Logout</MenuItem>
                            </Menu>
                        </div>
                    </Toolbar>
                </AppBar>
                <Toolbar />
                {renderService()}
            </Box>
        </Box>
    );
};

export default Dashboard;
