import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PaymentStatus.css';

const PaymentFailure = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear sessionStorage on failure
    sessionStorage.removeItem('pendingRegistration');
  }, []);

  return (
    <div className="payment-status-container error-bg">
      <div className="payment-status-card">
        <div className="status-icon error">✕</div>
        <h1>Payment Failed</h1>
        <p>Your payment could not be processed. Please try again or contact support.</p>
        <div className="button-group">
          <button className="btn btn-primary" onClick={() => navigate('/register')}>
            Try Again
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/login')}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
