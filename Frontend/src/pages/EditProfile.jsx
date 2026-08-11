import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosInstance';
import '../styles/EditProfile.css';

const EditProfile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bio: '',
    phone_number: '',
    location: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading2, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
      setLoading(true);
      const res = await axiosInstance.get('/accounts/profile/');
      setFormData({
        bio: res.data?.bio || '',
        phone_number: res.data?.phone_number || '',
        location: res.data?.location || '',
        email: user?.email || res.data?.email || '',
      });
      if (res.data?.profile_image_url) {
        setImagePreview(res.data.profile_image_url);
      }
      setErrors({});
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setErrors({ general: 'Failed to load profile data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({
          ...prev,
          image: 'Please select a valid image file.',
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB
        setErrors((prev) => ({
          ...prev,
          image: 'Image size must be less than 5MB.',
        }));
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors((prev) => ({
        ...prev,
        image: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.phone_number && !/^[0-9\s\-\+\(\)]*$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number.';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (passwordData.new_password && passwordData.new_password.length < 4) {
      newErrors.new_password = 'Password must be at least 4 characters.';
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match.';
    }

    if (passwordData.new_password && !passwordData.current_password) {
      newErrors.current_password = 'Current password is required to change password.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('phone_number', formData.phone_number);
      formDataToSend.append('location', formData.location);

      if (image) {
        formDataToSend.append('profile_image', image);
      }

      await axiosInstance.patch('/accounts/profile/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      console.error('Update failed:', err);
      setErrors({
        general:
          err.response?.data?.detail ||
          err.response?.data?.error ||
          'Failed to update profile. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    if (!passwordData.new_password) {
      return; // No password change
    }

    setSubmitting(true);
    try {
      await axiosInstance.patch('/accounts/update-user/', {
        password: passwordData.new_password,
        current_password: passwordData.current_password,
      });

      setSuccess(true);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Password change failed:', err);
      setErrors({
        general:
          err.response?.data?.detail ||
          err.response?.data?.error ||
          'Failed to change password. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-card">
        <h1 className="page-title">Edit Profile</h1>

        {success && (
          <div className="success-message">
            ✓ Profile updated successfully! Redirecting...
          </div>
        )}

        {errors.general && (
          <div className="error-message">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} className="edit-form">
          {/* Profile Image Upload */}
          <div className="form-section">
            <h2 className="section-title">Profile Picture</h2>
            <div className="image-upload-area">
              <div className="image-preview">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" />
                ) : (
                  <div className="placeholder">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="10" r="3"></circle>
                      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path>
                    </svg>
                    <p>No image selected</p>
                  </div>
                )}
              </div>

              <div className="upload-input-wrapper">
                <label htmlFor="image-input" className="upload-label">
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={submitting}
                  />
                  <span className="upload-button">
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </span>
                </label>
                <p className="upload-hint">JPG, PNG or GIF (max 5MB)</p>
              </div>

              {errors.image && (
                <span className="field-error">{errors.image}</span>
              )}
            </div>
          </div>

          {/* Bio Field */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={handleFormChange}
                maxLength="500"
                rows="4"
                className={errors.bio ? 'textarea-error' : ''}
              />
              <div className="char-count">
                {formData.bio.length}/500
              </div>
              {errors.bio && (
                <span className="field-error">{errors.bio}</span>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div className="form-section">
            <h2 className="section-title">Account Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  disabled
                  className="input-disabled"
                  title="Email cannot be changed"
                />
                <p className="help-text">Email address cannot be changed</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="form-section">
            <h2 className="section-title">Contact Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone_number"
                  placeholder="e.g., +977 9841234567"
                  value={formData.phone_number}
                  onChange={handleFormChange}
                  className={errors.phone_number ? 'input-error' : ''}
                />
                {errors.phone_number && (
                  <span className="field-error">{errors.phone_number}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  placeholder="e.g., Kathmandu, Nepal"
                  value={formData.location}
                  onChange={handleFormChange}
                />
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className="form-section">
            <h2 className="section-title">Change Password</h2>
            <div className="form-group">
              <label htmlFor="current-password">Current Password</label>
              <input
                id="current-password"
                type="password"
                name="current_password"
                placeholder="Enter your current password"
                value={passwordData.current_password}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    current_password: e.target.value,
                  }))
                }
                className={errors.current_password ? 'input-error' : ''}
              />
              {errors.current_password && (
                <span className="field-error">{errors.current_password}</span>
              )}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  name="new_password"
                  placeholder="Enter new password (min 4 characters)"
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      new_password: e.target.value,
                    }))
                  }
                  className={errors.new_password ? 'input-error' : ''}
                />
                {errors.new_password && (
                  <span className="field-error">{errors.new_password}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  name="confirm_password"
                  placeholder="Confirm new password"
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirm_password: e.target.value,
                    }))
                  }
                  className={errors.confirm_password ? 'input-error' : ''}
                />
                {errors.confirm_password && (
                  <span className="field-error">{errors.confirm_password}</span>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Profile Changes'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePasswordChange}
              disabled={submitting || !passwordData.new_password}
            >
              {submitting ? 'Updating...' : 'Change Password'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/profile')}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
