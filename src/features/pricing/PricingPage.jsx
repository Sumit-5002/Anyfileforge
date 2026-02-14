import React, { useState } from 'react';
import { Check, X, Zap, Crown, Rocket, Loader, CreditCard, BadgePercent } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/userService';
import SeoHead from '../../components/meta/SeoHead';
import './PricingPage.css';

function PricingPage() {
    const { user, userData } = useAuth();
    const [upgrading] = useState(false);
    const [checkoutPlan, setCheckoutPlan] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [discountPercent, setDiscountPercent] = useState(0);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState('');

    const plans = [
        {
            id: 'free',
            name: 'Free',
            description: 'Local-first tools for everyday tasks.',
            price: '$0',
            period: 'month',
            highlighted: false,
            icon: Zap,
            cta: 'Start Free',
            features: [
                { text: 'Serverless tools (offline-ready)', included: true },
                { text: 'Basic PDF and Image tools', included: true },
                { text: 'Community support', included: true },
                { text: 'Server mode tools', included: false },
                { text: 'Premium processing', included: false }
            ]
        },
        {
            id: 'premium',
            name: 'Premium',
            description: 'Advanced tools for professionals and labs.',
            price: '$9',
            priceValue: 9,
            period: 'month',
            highlighted: true,
            icon: Crown,
            cta: 'Upgrade to Premium',
            features: [
                { text: 'Everything in Free', included: true },
                { text: 'Premium tool access', included: true },
                { text: 'Priority updates', included: true },
                { text: 'Server mode tools', included: true },
                { text: 'Batch processing limits removed', included: true }
            ]
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            description: 'SSO, audit logs, and dedicated support.',
            price: 'Let’s talk',
            period: 'custom',
            highlighted: false,
            icon: Rocket,
            cta: 'Contact Sales',
            features: [
                { text: 'Institution SSO & RBAC', included: true },
                { text: 'Custom storage & compliance', included: true },
                { text: 'Dedicated support', included: true },
                { text: 'Custom SLAs', included: true },
                { text: 'On-prem deployment options', included: true }
            ]
        }
    ];

    const handlePlanSelect = async (planId) => {
        // ... (keep existing handlePlanSelect logic) ...
        if (planId === 'enterprise') {
            window.location.href = 'mailto:enterprise@anyfileforge.com';
            return;
        }

        if (planId === 'premium') {
            setCheckoutPlan(plans.find((plan) => plan.id === 'premium'));
            setPaymentMessage('');
        }
    };

    const applyCoupon = () => {
        const code = couponCode.trim().toUpperCase();
        if (code === 'DEMO100') {
            setDiscountPercent(100);
            setPaymentMessage('Coupon applied: 100% demo discount.');
        } else if (code === 'FORGE50') {
            setDiscountPercent(50);
            setPaymentMessage('Coupon applied: 50% off.');
        } else {
            setDiscountPercent(0);
            setPaymentMessage('Invalid coupon code.');
        }
    };

    const handleDemoPayment = async () => {
        if (!user) {
            setPaymentMessage('Please login to complete checkout.');
            return;
        }

        setPaymentProcessing(true);
        setPaymentMessage('');
        try {
            /**
             * ⚠️ SECURITY NOTE: The following call is for demo purposes only.
             * Updating sensitive user state (like 'tier') from the client is a security risk.
             * Our Firestore rules now block this update to prevent unauthorized upgrades.
             * In production, this should trigger a backend function.
             */
            await userService.upgradeToPremium(user.uid);
            setPaymentMessage('Demo payment complete. Premium activated.');
            window.location.reload();
        } catch (error) {
            console.error('Upgrade error:', error);
            setPaymentMessage('Payment failed. Try again.');
        } finally {
            setPaymentProcessing(false);
        }
    };

    const checkoutTotal = checkoutPlan
        ? Math.max(0, (checkoutPlan.priceValue || 0) * (1 - discountPercent / 100))
        : 0;

    const formatTotal = (value) => (value === 0 ? '$0' : `$${value.toFixed(2)}`);

    return (
        <>
            <SeoHead
                title="Pricing - AnyFileForge"
                description="Simple, transparent pricing for premium file processing tools. Local-first, secure, and unlimited for professionals."
            />
            <div className="pricing-page">
                <div className="container">
                    <div className="page-header">
                        <h1 className="page-title">Simple, Transparent Pricing</h1>
                        <p className="page-subtitle">
                            Choose the plan that fits your needs. Current: <strong>{userData?.tier?.toUpperCase() || 'FREE'}</strong>
                        </p>
                    </div>


                    <div className="pricing-grid">
                        {plans.map((plan, index) => {
                            const isCurrentPlan = userData?.tier === plan.id || (!userData && plan.id === 'free');

                            return (
                                <div
                                    key={index}
                                    className={`pricing-card card ${plan.highlighted ? 'highlighted' : ''} ${isCurrentPlan ? 'current' : ''}`}
                                >
                                    {plan.highlighted && !isCurrentPlan && (
                                        <div className="popular-badge">
                                            <span>Most Popular</span>
                                        </div>
                                    )}

                                    <div className="plan-header">
                                        <div className="plan-icon" style={{
                                            background: plan.highlighted
                                                ? 'linear-gradient(135deg, var(--primary-600), var(--primary-700))'
                                                : 'var(--gray-200)'
                                        }}>
                                            <plan.icon
                                                size={32}
                                                color={plan.highlighted ? 'white' : 'var(--gray-700)'}
                                            />
                                        </div>
                                        <h3 className="plan-name">{plan.name}</h3>
                                        <p className="plan-description">{plan.description}</p>
                                    </div>

                                    <div className="plan-price">
                                        <span className="price">{plan.price}</span>
                                        <span className="period">/{plan.period}</span>
                                    </div>

                                    <ul className="features-list">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className={`feature-item ${feature.included ? 'included' : 'excluded'}`}>
                                                {feature.included ? (
                                                    <Check size={18} className="feature-icon" />
                                                ) : (
                                                    <X size={18} className="feature-icon" />
                                                )}
                                                <span>{feature.text}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'} btn-full`}
                                        disabled={isCurrentPlan || upgrading}
                                        onClick={() => handlePlanSelect(plan.id)}
                                    >
                                        {upgrading && plan.id === 'premium' ? (
                                            <Loader className="spinning" size={18} />
                                        ) : isCurrentPlan ? 'Current Plan' : plan.cta}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {checkoutPlan && (
                        <div className="checkout-panel">
                            <div className="checkout-header">
                                <div>
                                    <h2>Checkout</h2>
                                    <p>Secure demo checkout for {checkoutPlan.name}.</p>
                                </div>
                                <button className="btn btn-secondary" onClick={() => setCheckoutPlan(null)}>Close</button>
                            </div>

                            <div className="checkout-grid">
                                <div className="checkout-box">
                                    <h3>Order Summary</h3>
                                    <div className="summary-row">
                                        <span>Plan</span>
                                        <span>{checkoutPlan.name}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Price</span>
                                        <span>{checkoutPlan.price} / {checkoutPlan.period}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Discount</span>
                                        <span>{discountPercent}%</span>
                                    </div>
                                    <div className="summary-total">
                                        <span>Total</span>
                                        <span>{formatTotal(checkoutTotal)}</span>
                                    </div>
                                </div>

                                <div className="checkout-box">
                                    <h3>Coupon Code</h3>
                                    <div className="coupon-row">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="DEMO100"
                                        />
                                        <button className="btn btn-secondary" onClick={applyCoupon}>
                                            <BadgePercent size={16} />
                                            Apply
                                        </button>
                                    </div>
                                    <p className="hint">Try DEMO100 for free demo checkout.</p>
                                </div>

                                <div className="checkout-box">
                                    <h3>Payment Gateway</h3>
                                    <div className="payment-gateway">
                                        <CreditCard size={18} />
                                        <div>
                                            <strong>DemoPay (Sandbox)</strong>
                                            <p>No real charges. Demo only.</p>
                                        </div>
                                    </div>
                                    <div className="payment-fields">
                                        <input type="text" placeholder="Card number (demo)" />
                                        <div className="payment-row">
                                            <input type="text" placeholder="MM/YY" />
                                            <input type="text" placeholder="CVC" />
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-primary btn-full"
                                        onClick={handleDemoPayment}
                                        disabled={paymentProcessing}
                                    >
                                        {paymentProcessing ? 'Processing...' : 'Complete Demo Payment'}
                                    </button>
                                    {paymentMessage && <p className="payment-message">{paymentMessage}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pricing-faq container">
                        <h2 className="faq-title">Privacy & Technical FAQ</h2>
                        <div className="faq-grid">
                            <div className="faq-item">
                                <h3>Do you keep a copy of my processed files?</h3>
                                <p><strong>Absolutely not.</strong> Unlike competitors who store files for 2 hours, we never receive them. All processing happens locally in your browser's RAM and CPU. Once you close the tab, the data is gone forever.</p>
                            </div>
                            <div className="faq-item">
                                <h3>Is it safe for HIPAA or GDPR compliance?</h3>
                                <p>Yes. Because the data never leaves the patient's or professional's device, it is the highest form of data residency compliance possible.</p>
                            </div>
                            <div className="faq-item">
                                <h3>Why is there a file size limit on Free?</h3>
                                <p>Large files require significant browser RAM. We set limits on the Free plan to ensure stability for most users, while Premium unlocks the full potential of your hardware.</p>
                            </div>
                            <div className="faq-item">
                                <h3>Can I work offline?</h3>
                                <p>Yes! Once the website is loaded, most of our tools (Merge, Split, Image Convert) will work even if you disconnect from the internet.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default PricingPage;
