import React from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };
    return (
        <button className="logout-btn" onClick={logout}>Logout</button>
    );
}

export default Logout;