import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    // Support token in query or hash fragment
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = query.get('token') || hash.get('token');
    const error = query.get('error') || hash.get('error');

    if (token) {
      setToken(token).then(() => {
        toast.success('Logged in with Google');
        navigate('/dashboard');
      });
    } else if (error) {
      toast.error(`Google login failed: ${decodeURIComponent(error)}`);
      navigate('/login');
    } else {
      toast.error('Google login failed');
      navigate('/login');
    }
  }, [navigate, setToken]);

  return <div>Signing in with Google...</div>;
};

export default GoogleCallback;
