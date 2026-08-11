import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { initiateEsewaPayment, generateTransactionId, PRICING_PLANS } from '../../Services/esewa';
import './Register.css';

const Register = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [step, setStep] = useState('form'); // form, plan, payment
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password1: '',
    password2: '',
  });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading2, setLoading] = useState(false);

  if (loading) return <div className="loading">Loading...</div>;
  if (user) return <Navigate to="/" replace />;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password1) {
      newErrors.password1 = 'Password is required';
    } else if (formData.password1.length < 4) {
      newErrors.password1 = 'Password must be at least 4 characters';
    }

    if (!formData.password2) {
      newErrors.password2 = 'Confirm password is required';
    } else if (formData.password1 !== formData.password2) {
      newErrors.password2 = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('plan');
    }
  };

  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan);
  };

  const handlePaymentStart = async () => {
    setLoading(true);
    try {
      const transactionId = generateTransactionId();
      const amount = PRICING_PLANS[selectedPlan].price;

      console.log('[v0] Payment starting:', { transactionId, amount, plan: selectedPlan });

      // Store registration data in sessionStorage - includes all required fields for account creation
      const registrationData = {
        email: formData.email,
        username: formData.username,
        password1: formData.password1,
        password2: formData.password2,
        role: 'user',
        planType: selectedPlan,
        membership_type: selectedPlan, // Important: backend expects this field
        transaction_id: transactionId,
      };

      console.log('[v0] Storing registration data:', registrationData);
      sessionStorage.setItem('pendingRegistration', JSON.stringify(registrationData));

      // Initiate eSewa payment
      await initiateEsewaPayment({
        transactionId,
        amount,
        email: formData.email,
        membershipType: selectedPlan,
        userData: registrationData,
      });

    } catch (error) {
      console.error('[v0] Payment initiation error:', error);
      setErrors({ general: 'Failed to initiate payment. Please try again.' });
      setLoading(false);
    }
  };

  // Step 1: Registration Form
  if (step === 'form') {
    return (
      <div className="register-container">
        <div className="register-card">
          <h1 className="register-title">Create Your Account</h1>
          <p className="register-subtitle">Join us today and get started</p>

          <form onSubmit={handleFormSubmit} className="register-form">
            {errors.general && <div className="error-message">{errors.general}</div>}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleFormChange}
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleFormChange}
                className={errors.username ? 'input-error' : ''}
              />
              {errors.username && <span className="field-error">{errors.username}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password1">Password</label>
              <input
                id="password1"
                type="password"
                name="password1"
                placeholder="Enter password"
                value={formData.password1}
                onChange={handleFormChange}
                className={errors.password1 ? 'input-error' : ''}
              />
              {errors.password1 && <span className="field-error">{errors.password1}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password2">Confirm Password</label>
              <input
                id="password2"
                type="password"
                name="password2"
                placeholder="Confirm password"
                value={formData.password2}
                onChange={handleFormChange}
                className={errors.password2 ? 'input-error' : ''}
              />
              {errors.password2 && <span className="field-error">{errors.password2}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Continue to Payment
            </button>
          </form>

          <div className="register-footer">
            Already have an account? <a href="/login">Sign In</a>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Plan Selection
  if (step === 'plan') {
    return (
      <div className="register-container">
        <div className="register-card plan-card">
          <button
            className="back-button"
            onClick={() => setStep('form')}
            title="Go back to form"
          >
            ← Back
          </button>

          <h1 className="register-title">Choose Your Plan</h1>
          <p className="register-subtitle">Select a membership plan to proceed</p>

          <div className="plans-grid">
            {Object.entries(PRICING_PLANS).map(([key, plan]) => (
              <div
                key={key}
                className={`plan-card-item ${selectedPlan === key ? 'selected' : ''}`}
                onClick={() => handlePlanSelection(key)}
              >
                <h3>{plan.name}</h3>
                <div className="price">
                  Rs. {plan.price}
                  <span className="duration">/{plan.duration}</span>
                </div>
                <ul className="features">
                  <li>✓ Full access</li>
                  <li>✓ Premium features</li>
                  <li>✓ Email support</li>
                  {key === 'YEARLY' && <li>✓ Save 12%</li>}
                </ul>
                <button
                  type="button"
                  className={`btn ${selectedPlan === key ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handlePlanSelection(key)}
                >
                  {selectedPlan === key ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>

          {selectedPlan && (
            <button
              className="btn btn-primary btn-block"
              onClick={handlePaymentStart}
              disabled={loading2}
            >
              {loading2 ? 'Processing...' : 'Proceed to Payment'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default Register;
