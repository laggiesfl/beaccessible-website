(() => {
  const referenceElement = document.getElementById('order-reference');
  const statusElement = document.getElementById('payment-status');
  const checkButton = document.getElementById('check-status');
  const orderRef = new URLSearchParams(window.location.search).get('order') || '';
  const validReference = /^BA-\d{8}-[A-F0-9]{8}$/.test(orderRef);

  if (!validReference) {
    statusElement.textContent = 'A valid order reference was not provided. A successful payment has not been confirmed.';
    return;
  }

  referenceElement.textContent = orderRef;
  checkButton.hidden = false;

  async function checkStatus() {
    checkButton.setAttribute('aria-busy', 'true');
    statusElement.textContent = 'Checking for a verified payment notification…';

    try {
      const response = await fetch(`/.netlify/functions/order-status?order=${encodeURIComponent(orderRef)}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Status unavailable');

      const order = await response.json();
      if (order.paymentStatus === 'paid') {
        statusElement.textContent = 'Payment verified. BeAccessible will send accessible intake instructions to the email address supplied at checkout.';
      } else if (order.paymentStatus === 'pending') {
        statusElement.textContent = 'Payment confirmation is pending. Fulfilment has not started. You can check again without restarting checkout.';
      } else {
        statusElement.textContent = 'Payment has not been verified. Fulfilment has not started. Contact BeAccessible if you need help.';
      }
    } catch {
      statusElement.textContent = 'Payment status could not be confirmed right now. A successful payment has not been confirmed. Try again or contact BeAccessible.';
    } finally {
      checkButton.removeAttribute('aria-busy');
    }
  }

  checkButton.addEventListener('click', checkStatus);
  checkStatus();
})();
