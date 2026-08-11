import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, creating-account, success, error
  const [error, setError] = useState(null);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const encodedData = params.get("data");

        if (!encodedData) {
          setError("No payment data found");
          setStatus("error");
          return;
        }

        const decoded = JSON.parse(atob(encodedData));
        console.log("[v0] Decoded Payment:", decoded);

        if (decoded.status !== "COMPLETE") {
          setError("Payment was not completed successfully");
          setStatus("error");
          return;
        }

        // Get pending registration data from sessionStorage
        const pendingRegistrationData = sessionStorage.getItem("pendingRegistration");

        if (!pendingRegistrationData) {
          setError("Registration data not found. Please try registering again.");
          setStatus("error");
          return;
        }

        const userData = JSON.parse(pendingRegistrationData);
        console.log("[v0] Found pending registration data:", userData);

        // Create account and membership directly (this also verifies payment status)
        setStatus("creating-account");
        console.log("[v0] Creating account and membership...");

        const registrationResponse = await axios.post(
          "http://127.0.0.1:8000/api/accounts/register-with-payment/",
          {
            email: userData.email,
            username: userData.username,
            password1: userData.password1,
            password2: userData.password2,
            role: userData.role || "user",
            membership_type: userData.membership_type || userData.planType,
            payment_reference: decoded.transaction_code,
            transaction_id: decoded.transaction_uuid,
          }
        );

        console.log("[v0] Account created successfully:", registrationResponse.data);

        // Clear session storage
        sessionStorage.removeItem("pendingRegistration");

        // Show success and redirect
        setStatus("success");

        // Redirect to login or dashboard after 2 seconds
        setTimeout(() => {
          navigate("/login", {
            state: {
              message: "Account created successfully! Please log in.",
              email: userData.email
            }
          });
        }, 2000);

      } catch (err) {
        console.error("[v0] Error in payment success flow:", err.response?.data || err.message);
        setError(err.response?.data?.error || err.message || "Something went wrong");
        setStatus("error");
      }
    };

    handlePaymentSuccess();
  }, [location, navigate]);

  // Verifying Payment
  if (status === "verifying") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <h2 style={styles.title}>Verifying Payment</h2>
          <p style={styles.description}>Please wait while we verify your payment...</p>
        </div>
      </div>
    );
  }

  // Creating Account
  if (status === "creating-account") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <h2 style={styles.title}>Creating Your Account</h2>
          <p style={styles.description}>Setting up your membership...</p>
        </div>
      </div>
    );
  }

  // Success
  if (status === "success") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.title}>Account Created Successfully!</h2>
          <p style={styles.description}>Your membership is now active.</p>
          <p style={styles.redirectText}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Error
  if (status === "error") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>✕</div>
          <h2 style={styles.title}>Something Went Wrong</h2>
          <p style={styles.error}>{error}</p>
          <button
            style={styles.button}
            onClick={() => navigate("/register")}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    padding: "20px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    padding: "40px",
    textAlign: "center",
    maxWidth: "400px",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3498db",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  successIcon: {
    width: "60px",
    height: "60px",
    backgroundColor: "#2ecc71",
    color: "white",
    borderRadius: "50%",
    fontSize: "36px",
    lineHeight: "60px",
    margin: "0 auto 20px",
  },
  errorIcon: {
    width: "60px",
    height: "60px",
    backgroundColor: "#e74c3c",
    color: "white",
    borderRadius: "50%",
    fontSize: "36px",
    lineHeight: "60px",
    margin: "0 auto 20px",
  },
  title: {
    margin: "0 0 10px 0",
    fontSize: "24px",
    color: "#333",
  },
  description: {
    margin: "0 0 10px 0",
    fontSize: "14px",
    color: "#666",
  },
  redirectText: {
    margin: "15px 0 0 0",
    fontSize: "12px",
    color: "#999",
  },
  error: {
    margin: "10px 0",
    fontSize: "14px",
    color: "#e74c3c",
    backgroundColor: "#ffe6e6",
    padding: "10px",
    borderRadius: "4px",
  },
  button: {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },
};

// Add animation keyframes
const style = document.createElement("style");
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default PaymentSuccess;
