// stripe-config.js — ProposalIQ Payment Links
// Stripe dashboard se payment link banao aur yahan paste karo
// Free: https://dashboard.stripe.com → Payment Links → Create

const STRIPE_CONFIG = {
  IS_CONFIGURED: false,          // true karo jab real link ho
  monthly_link:  '',             // e.g. "https://buy.stripe.com/xxxx"
  yearly_link:   '',             // e.g. "https://buy.stripe.com/yyyy"
  price_monthly: '$19',
  price_yearly:  '$149',
  currency:      'USD',
};
