// import React, { useState } from 'react';
// import { generateSignature } from '../Services/esewa';
// // import '../styles/EsewaDebugger.css';

// export default function EsewaDebugger() {
//   const [totalAmount, setTotalAmount] = useState('1500');
//   const [transactionUuid, setTransactionUuid] = useState('241028');
//   const [productCode, setProductCode] = useState('EPAYTEST');
//   const [secretKey, setSecretKey] = useState('8gBm/:&EnhH.1/q');
//   const [signature, setSignature] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [debugInfo, setDebugInfo] = useState('');

//   const handleGenerateSignature = async () => {
//     setLoading(true);
//     setError('');
//     setSignature('');
//     setDebugInfo('');

//     try {
//       const message = `${totalAmount},${transactionUuid},${productCode}`;
//       setDebugInfo(`Message to Sign: "${message}"\nSecret: "${secretKey}"`);

//       const sig = await generateSignature(
//         totalAmount,
//         transactionUuid,
//         productCode,
//         secretKey
//       );

//       setSignature(sig);
//       console.log('[v0] Generated Signature:', sig);
//       console.log('[v0] Message:', message);
//     } catch (err) {
//       setError(`Error: ${err.message}`);
//       console.error('[v0] Error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCopySignature = () => {
//     navigator.clipboard.writeText(signature);
//     alert('Signature copied to clipboard!');
//   };

//   const handleTestWithOfficial = () => {
//     // Official example from eSewa
//     setTotalAmount('110');
//     setTransactionUuid('241028');
//     setProductCode('EPAYTEST');
//     setSecretKey('8gBm/:&EnhH.1/q');
//     setDebugInfo('');
//     setSignature('');
//   };

//   return (
//     <div className="esewa-debugger">
//       <div className="debugger-container">
//         <h1>eSewa Signature Debugger</h1>
//         <p className="subtitle">Generate and test HMAC-SHA256 signatures for eSewa payments</p>

//         <div className="form-section">
//           <div className="form-group">
//             <label>Total Amount</label>
//             <input
//               type="text"
//               value={totalAmount}
//               onChange={(e) => setTotalAmount(e.target.value)}
//               placeholder="e.g., 1500"
//             />
//           </div>

//           <div className="form-group">
//             <label>Transaction UUID</label>
//             <input
//               type="text"
//               value={transactionUuid}
//               onChange={(e) => setTransactionUuid(e.target.value)}
//               placeholder="e.g., 241028"
//             />
//           </div>

//           <div className="form-group">
//             <label>Product Code (Merchant Code)</label>
//             <input
//               type="text"
//               value={productCode}
//               onChange={(e) => setProductCode(e.target.value)}
//               placeholder="e.g., EPAYTEST"
//             />
//           </div>

//           <div className="form-group">
//             <label>Secret Key</label>
//             <input
//               type="text"
//               value={secretKey}
//               onChange={(e) => setSecretKey(e.target.value)}
//               placeholder="e.g., 8gBm/:&EnhH.1/q"
//             />
//           </div>

//           <div className="button-group">
//             <button
//               onClick={handleGenerateSignature}
//               disabled={loading}
//               className="btn-generate"
//             >
//               {loading ? 'Generating...' : 'Generate Signature'}
//             </button>
//             <button
//               onClick={handleTestWithOfficial}
//               className="btn-test"
//             >
//               Test with Official Example
//             </button>
//           </div>
//         </div>

//         {debugInfo && (
//           <div className="debug-info">
//             <h3>Debug Information</h3>
//             <pre>{debugInfo}</pre>
//           </div>
//         )}

//         {error && (
//           <div className="error-message">
//             <strong>Error:</strong> {error}
//           </div>
//         )}

//         {signature && (
//           <div className="signature-result">
//             <h3>Generated Signature</h3>
//             <div className="signature-box">
//               <code>{signature}</code>
//               <button onClick={handleCopySignature} className="btn-copy">
//                 Copy to Clipboard
//               </button>
//             </div>

//             <div className="form-html">
//               <h3>HTML Form (for testing)</h3>
//               <pre>
// {`<form action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST">
//   <input type="hidden" name="amount" value="${totalAmount}">
//   <input type="hidden" name="tax_amount" value="0">
//   <input type="hidden" name="total_amount" value="${totalAmount}">
//   <input type="hidden" name="transaction_uuid" value="${transactionUuid}">
//   <input type="hidden" name="product_code" value="${productCode}">
//   <input type="hidden" name="product_service_charge" value="0">
//   <input type="hidden" name="product_delivery_charge" value="0">
//   <input type="hidden" name="success_url" value="http://localhost:5173/payment-success">
//   <input type="hidden" name="failure_url" value="http://localhost:5173/payment-failure">
//   <input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code">
//   <input type="hidden" name="signature" value="${signature}">
//   <input type="submit" value="Pay with eSewa">
// </form>`}
//               </pre>
//             </div>

//             <div className="comparison">
//               <h3>Official Example</h3>
//               <p><strong>Amount:</strong> 110</p>
//               <p><strong>UUID:</strong> 241028</p>
//               <p><strong>Product Code:</strong> EPAYTEST</p>
//               <p><strong>Expected Signature:</strong> i94zsd3oXF6ZsSr/kGqT4sSzYQzjj1W/waxjWyRwaME=</p>
//               <p><strong>Your Signature:</strong> {signature}</p>
//               <p>{signature === 'i94zsd3oXF6ZsSr/kGqT4sSzYQzjj1W/waxjWyRwaME=' ? '✅ MATCHES!' : '❌ Does not match'}</p>
//             </div>
//           </div>
//         )}

//         <div className="help-section">
//           <h3>How to use:</h3>
//           <ol>
//             <li>Click "Test with Official Example" to load the eSewa official test case</li>
//             <li>Click "Generate Signature"</li>
//             <li>Your signature should match: <code>i94zsd3oXF6ZsSr/kGqT4sSzYQzjj1W/waxjWyRwaME=</code></li>
//             <li>If it matches, your app's signatures will be correct</li>
//             <li>If it doesn't match, we need to debug the signature algorithm</li>
//           </ol>
//         </div>
//       </div>
//     </div>
//   );
// }
