import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosInstance';
import '../styles/Profile.css';

const Profile = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!loading && user) {
      fetchProfile();
    }
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    try {
      setPageLoading(true);
      const res = await axiosInstance.get('/accounts/profile/');
      setProfile(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile. Please try refreshing the page.');
      setProfile(null);
    } finally {
      setPageLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchProfile}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          {profile?.profile_image_url ? (
            <img
              src={profile.profile_image_url}
              alt="Profile"
              className="avatar-image"
            />
          ) : (
            <div className="avatar-placeholder">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>

        <div className="profile-info">
          <div className="info-section">
            <h2 className="section-title">Account Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Username</label>
                <p>{user?.username || 'N/A'}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{user?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h2 className="section-title">Personal Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Bio</label>
                <p>{profile?.bio || 'No bio added yet'}</p>
              </div>
              <div className="info-item">
                <label>Phone Number</label>
                <p>{profile?.phone_number || 'Not provided'}</p>
              </div>
              <div className="info-item">
                <label>Location</label>
                <p>{profile?.location || 'Not provided'}</p>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/edit-profile')}
            >
              Edit Profile
            </button>
            {/* <button
              className="btn btn-outline"
              onClick={() => navigate('/')}
            >
              Back to Dashboard
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
