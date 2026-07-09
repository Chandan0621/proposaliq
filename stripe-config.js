// stripe-config.js — ProposalIQ Payment Links
// Create a payment link from the Stripe dashboard and paste it here
// Free: https://dashboard.stripe.com → Payment Links → Create

const STRIPE_CONFIG = {
  IS_CONFIGURED: false,          // Set to true when you paste your real link
  monthly_link:  '',             // e.g. "https://buy.stripe.com/xxxx"
  yearly_link:   '',             // e.g. "https://buy.stripe.com/yyyy"
  price_monthly: '$19',
  price_yearly:  '$149',
  currency:      'USD',
};
