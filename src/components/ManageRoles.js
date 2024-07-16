import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import {
    Container,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    Select,
    MenuItem,
    Button,
    Paper,
} from '@mui/material';

const roles = ['guest', 'Admin', 'Developer', 'Quality Assurance', 'Business Analyst', 'Team Lead', 'IT OPS', 'Super Admin'];

const ManageRoles = () => {
    const [users, setUsers] = useState([]);
    const [selectedRole, setSelectedRole] = useState({});

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const querySnapshot = await getDocs(collection(firestore, 'users'));
                const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(usersData);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, []);

    const handleRoleChange = (userId, role) => {
        setSelectedRole({ ...selectedRole, [userId]: role });
    };

    const handleSave = async (userId) => {
        const userDocRef = doc(firestore, 'users', userId);
        try {
            await updateDoc(userDocRef, { role: selectedRole[userId] });
            alert('Role updated successfully');
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Error updating role. Please try again.');
        }
    };

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ padding: 3, marginTop: 5 }}>
                <Typography variant="h4" gutterBottom>
                    Manage User Roles
                </Typography>
                <List>
                    {users.map(user => (
                        <ListItem key={user.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <ListItemText
                                primary={user.email} // Display email
                                secondary={`Current role: ${user.role}`}
                            />
                            <Select
                                value={selectedRole[user.id] || user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                disabled={user.role === 'Super Admin'} // Disable if role is Super Admin
                            >
                                {roles.map(role => (
                                    <MenuItem key={role} value={role}>{role}</MenuItem>
                                ))}
                            </Select>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={() => handleSave(user.id)} 
                                sx={{ ml: 2 }}
                                disabled={user.role === 'Super Admin'} // Disable button if role is Super Admin
                            >
                                Save
                            </Button>
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Container>
    );
};

export default ManageRoles;
