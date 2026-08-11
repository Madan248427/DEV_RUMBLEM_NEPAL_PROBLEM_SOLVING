import axios from "axios";

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const API_BASE = "http://127.0.0.1:8000/api/accounts";

/*
|--------------------------------------------------------------------------
| PRICING PLANS
|--------------------------------------------------------------------------
*/

export const PRICING_PLANS = {
  MONTHLY: {
    name: "Monthly",
    price: 1500,
    duration: "month",
    value: "MONTHLY",
  },
  YEARLY: {
    name: "Yearly",
    price: 16000,
    duration: "year",
    value: "YEARLY",
  },
};

/*
|--------------------------------------------------------------------------
| GENERATE TRANSACTION ID
|--------------------------------------------------------------------------
| Format: YYYYMMDD-HHMMSS
| Example: 20260216-211123
*/

export const generateTransactionId = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  return `${date}-${time}`;
};

/*
|--------------------------------------------------------------------------
| INITIATE ESEWA PAYMENT
|--------------------------------------------------------------------------
| 1. Call backend to create PaymentRecord
| 2. Backend generates signature securely
| 3. Backend returns form fields
| 4. Frontend auto-submits to eSewa
*/

export const initiateEsewaPayment = async ({
  transactionId,
  amount,
  email,
  membershipType,
  userData,
}) => {
  try {
    console.log("🚀 Initiating eSewa Payment:", {
      transactionId,
      amount,
      membershipType,
    });

    // Store registration data temporarily
    if (userData) {
      sessionStorage.setItem(
        "pendingRegistration",
        JSON.stringify({
          ...userData,
          membership_type: membershipType,
          transaction_id: transactionId,
        })
      );
    }

    // 🔐 Call backend to get signed payment fields
    const response = await axios.post(
      `${API_BASE}/initiate-payment/`,
      {
        transaction_id: transactionId,
        amount,
        email,
        membership_type: membershipType,
      }
    );

    const paymentData = response.data;

    console.log("✅ Backend returned signed data:", paymentData);

    // 🧾 Create form dynamically
    const form = document.createElement("form");
    form.method = "POST";
    form.action = paymentData.gateway;
    form.style.display = "none";

    Object.entries(paymentData).forEach(([key, value]) => {
      if (key === "gateway") return;

      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);

    console.log("➡ Redirecting to eSewa...");
    form.submit();

  } catch (error) {
    console.error("❌ Payment initiation failed:", error);
    throw error;
  }
};

/*
|--------------------------------------------------------------------------
| VERIFY PAYMENT (After Success Redirect)
|--------------------------------------------------------------------------
| Call this inside PaymentSuccess.jsx
*/

export const verifyPayment = async (
  transactionId,
  referenceId
) => {
  try {
    const response = await axios.post(
      `${API_BASE}/verify-payment/`,
      {
        transaction_id: transactionId,
        reference_id: referenceId,
      }
    );

    console.log("✅ Payment verified:", response.data);
    return response.data;

  } catch (error) {
    console.error("❌ Payment verification failed:", error);
    throw error;
  }
};

/*
|--------------------------------------------------------------------------
| COMPLETE REGISTRATION AFTER PAYMENT
|--------------------------------------------------------------------------
*/

export const completeRegistrationWithPayment = async (
  paymentReference
) => {
  try {
    const storedData = sessionStorage.getItem("pendingRegistration");

    if (!storedData) {
      throw new Error("No pending registration found");
    }

    const userData = JSON.parse(storedData);

    const response = await axios.post(
      `${API_BASE}/register-with-payment/`,
      {
        ...userData,
        payment_reference: paymentReference,
        transaction_id: userData.transaction_id,
      }
    );

    // Clear session storage after success
    sessionStorage.removeItem("pendingRegistration");

    console.log("🎉 Registration completed:", response.data);

    return response.data;

  } catch (error) {
    console.error("❌ Registration with payment failed:", error);
    throw error;
  }
};
