import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51HETfBK0bxcEMyTZ3LqswZUi9OElrfKOMKIgIhU3NemDDkQynKGz8SRLp32Ger2i5cdQP9SR1CRuRvhrTP9Vyi0a002XePSUeK'
);

export const bookTour = async (tourId) => {
  try {
    // 1. Get checkout endpoint session from the API
    const session = await axios(
      `http://127.0.0.1:9009/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2. Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    showAlert('error', error);
  }
};
