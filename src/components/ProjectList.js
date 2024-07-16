import React from 'react';
import { List, ListItem, ListItemText, Typography, Container } from '@mui/material';

const ProjectList = ({ projects, onProjectSelect }) => {
    if (!projects || projects.length === 0) {
        return <Typography variant="h6">No projects available.</Typography>;
    }

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Projects
            </Typography>
            <List>
                {projects.map(project => (
                    <ListItem 
                        button 
                        key={project.id} 
                        onClick={() => onProjectSelect(project.id)} 
                        sx={{ backgroundColor: '#f0f0f0', marginBottom: 1, borderRadius: 1 }}
                    >
                        <ListItemText
                            primary={project.title}
                            secondary={`Created by: ${project.createdBy}`}
                        />
                    </ListItem>
                ))}
            </List>
        </Container>
    );
};

export default ProjectList;
