import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { getProjects } from '../services/projectService'; 
import { useAuth } from '../context/AuthContext'; 

const ProjectSelector = ({ value, onChange, isDisabled = false }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      console.log('Fetching projects...');
      try {
        const res = await getProjects(); 
        setProjects(
          res.map(p => ({
            value: p._id,
            label: `${p.name} (${p.location || 'No location'})`,
          }))
        );
      } catch (err) {
        console.error(err);
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  
  

  return (
    <Select
      options={projects}
      value={projects.find(opt => opt.value === value) || null}
      onChange={opt => onChange(opt?.value)}
      isLoading={loading}
      isDisabled={isDisabled}
      placeholder="Select project..."
      className="basic-single"
      classNamePrefix="select"
    />
  );
};

export default ProjectSelector;