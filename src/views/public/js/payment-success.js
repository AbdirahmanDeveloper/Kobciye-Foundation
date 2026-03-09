// Extract reference from URL
const urlParams = new URLSearchParams(window.location.search);
const reference = urlParams.get('reference');

if (reference) {
  // Verify payment automatically
  verifyPayment(reference);
}

async function verifyPayment(reference) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`/api/donations/verify-payment/${reference}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('Payment verified successfully');
      // You can update the UI here if needed
      const detailsDiv = document.querySelector('.details');
      if (detailsDiv) {
        detailsDiv.innerHTML = `
          <p style="color: #10b981; font-weight: 600;">✓ Payment Verified Successfully!</p>
          <p class="reference">Reference: ${reference}</p>
        `;
      }
    } else {
      console.error('Payment verification failed:', data.message);
      const detailsDiv = document.querySelector('.details');
      if (detailsDiv) {
        detailsDiv.innerHTML = `
          <p style="color: #ef4444; font-weight: 600;">⚠ Payment verification failed</p>
          <p>Please contact support with reference: ${reference}</p>
        `;
      }
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
  }
}