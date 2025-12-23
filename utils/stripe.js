/**
 * Stripe Configuration
 * 
 * PROBLEM IT SOLVES: Centralized Stripe configuration and utility functions.
 * Separates payment logic from controllers for better organization.
 * 
 * HOW IT WORKS: Uses Stripe SDK to create payment intents for processing
 * payments. Stripe handles PCI compliance and secure payment processing.
 * 
 * REAL-WORLD: Companies use payment gateways like Stripe, Razorpay because:
 * - PCI compliance handled by gateway
 * - Secure payment processing
 * - Support for multiple payment methods
 * - Easy refunds and disputes
 * - Analytics and reporting
 * 
 * STRIPE FLOW:
 * 1. Create payment intent on server (this file)
 * 2. Return client secret to frontend
 * 3. Frontend uses Stripe.js to confirm payment
 * 4. Stripe webhook notifies server of payment success
 * 5. Server updates order status
 */

import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia' // Use latest API version
});

/**
 * Create Stripe Payment Intent
 * 
 * WHY: Payment intent represents an intent to collect payment.
 * Contains amount, currency, and returns client secret for frontend.
 * 
 * HOW: 
 * 1. Calculate total amount
 * 2. Create payment intent with Stripe
 * 3. Return client secret for frontend
 * 
 * @param {Number} amount - Amount in smallest currency unit (paise for INR)
 * @param {String} currency - Currency code (default: 'inr')
 * @param {String} metadata - Additional metadata (order ID, user ID)
 * @returns {Promise<Object>} Payment intent with client secret
 */
export const createPaymentIntent = async (amount, currency = 'inr', metadata = {}) => {
  try {
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Convert to smallest currency unit (paise for INR)
    const amountInSmallestUnit = Math.round(amount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true
      }
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
    throw new Error(`Payment processing failed: ${error.message}`);
  }
};

/**
 * Verify Stripe Payment Intent
 * 
 * WHY: Verify payment status after frontend confirms payment.
 * Ensures payment was successful before updating order.
 * 
 * @param {String} paymentIntentId - Payment intent ID from Stripe
 * @returns {Promise<Object>} Payment intent details
 */
export const verifyPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment verification error:', error);
    throw new Error(`Payment verification failed: ${error.message}`);
  }
};

/**
 * Create Stripe Refund
 * 
 * WHY: Allow refunds for cancelled orders or disputes.
 * 
 * @param {String} paymentIntentId - Payment intent ID to refund
 * @param {Number} amount - Amount to refund (optional, full refund if not provided)
 * @returns {Promise<Object>} Refund details
 */
export const createRefund = async (paymentIntentId, amount = null) => {
  try {
    const refundParams = {
      payment_intent: paymentIntentId
    };

    if (amount) {
      refundParams.amount = Math.round(amount * 100); // Convert to smallest unit
    }

    const refund = await stripe.refunds.create(refundParams);
    return refund;
  } catch (error) {
    console.error('Stripe refund error:', error);
    throw new Error(`Refund failed: ${error.message}`);
  }
};

export default stripe;
