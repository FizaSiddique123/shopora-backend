/**
 * Stripe Webhook Controller
 * 
 * PROBLEM IT SOLVES: Handles Stripe webhooks for payment events.
 * Webhooks are more reliable than polling payment status.
 * 
 * HOW IT WORKS: Stripe sends HTTP POST to webhook endpoint when
 * payment events occur. We verify signature and update order status.
 * 
 * REAL-WORLD: Companies use webhooks for:
 * - Payment confirmation (payment_intent.succeeded)
 * - Payment failures (payment_intent.payment_failed)
 * - Refund processing
 * - Subscription events
 * 
 * SETUP: Configure webhook endpoint in Stripe dashboard:
 * https://dashboard.stripe.com/webhooks
 * Endpoint: https://yourdomain.com/api/webhooks/stripe
 */

import { handleWebhook } from '../utils/stripe.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

/**
 * @desc    Handle Stripe webhook events
 * @route   POST /api/webhooks/stripe
 * @access  Public (Stripe sends requests directly)
 * 
 * IMPORTANT: This route should be before express.json() middleware
 * in server.js because Stripe needs raw body for signature verification.
 * 
 * EVENTS HANDLED:
 * - payment_intent.succeeded: Update order to paid
 * - payment_intent.payment_failed: Mark payment as failed
 */
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  try {
    // Verify webhook signature
    const event = await handleWebhook(req.body, sig, webhookSecret);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Find order by payment intent ID
        const order = await Order.findOne({
          'paymentResult.id': paymentIntent.id
        });

        if (order && !order.isPaid) {
          // Update order to paid
          order.isPaid = true;
          order.paidAt = new Date();
          order.paymentResult = {
            id: paymentIntent.id,
            status: 'succeeded',
            update_time: new Date().toISOString(),
            email_address: paymentIntent.receipt_email
          };
          order.status = 'processing';

          // Reduce product stock
          for (const item of order.orderItems) {
            const product = await Product.findById(item.product);
            if (product) {
              product.stock -= item.quantity;
              if (product.stock <= 0) {
                product.inStock = false;
              }
              await product.save();
            }
          }

          await order.save();
          console.log(`Order ${order.orderNumber} marked as paid via webhook`);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        
        const failedOrder = await Order.findOne({
          'paymentResult.id': failedPayment.id
        });

        if (failedOrder) {
          failedOrder.paymentResult = {
            id: failedPayment.id,
            status: 'failed'
          };
          await failedOrder.save();
          console.log(`Payment failed for order ${failedOrder.orderNumber}`);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

