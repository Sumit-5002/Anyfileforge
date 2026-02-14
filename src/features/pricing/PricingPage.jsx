import React, { useState } from 'react';
import { Check, X, Zap, Crown, Rocket, Loader, CreditCard, BadgePercent } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/userService';
import SeoHead from '../../components/meta/SeoHead';
import './PricingPage.css';

function PricingPage() {
    const { user, userData } = useAuth();
    const [checkoutPlan, setCheckoutPlan] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [discountPercent, setDiscountPercent] = useState(0);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState('');

    const plans = [
        {
            id: 'free',
            name: 'Free',
            description: 'Offline/local tools are free and serverless.',
            price: '$0',
            period: 'month',
            highlighted: false,
            icon: Zap,
            cta: 'Start Free (Offline)',
            features: [
                { text: 'Serverless tools (offline/local)', included: true },
                { text: 'Basic PDF and Image tools', included: true },
                { text: 'Community support', included: true },
                { text: 'Cloud uploads (Drive/Dropbox/OneDrive)', included: false },
                { text: 'Server-side processing for large files', included: false }
            ]
        },
        {
            id: 'premium',
            name: 'Premium',
            description: 'Online/server features for heavy & cloud-based work.',
            price: '$9',
            priceValue: 9,
            period: 'month',
            highlighted: true,
            icon: Crown,
            cta: 'Upgrade for Online Mode',
            features: [
                { text: 'Everything in Free (offline/local)', included: true },
                { text: 'Cloud uploads (Drive/Dropbox/OneDrive)', included: true },
                { text: 'Server-side processing for large files', included: true },
                { text: 'Optional paid server storage for future reuse', included: true },
                { text: 'Batch/priority processing', included: true }
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
                            Offline/local processing is free and serverless. Online/server processing (cloud uploads, large files, background jobs) is paid. Current: <strong>{userData?.tier?.toUpperCase() || 'FREE'}</strong>
                        </p>
                        <ul className="page-highlights">
                            <li>Offline Mode (Local): Free forever. Files stay on your device; no server used.</li>
                            <li>Online Mode (Server): Paid. Required for cloud-source uploads (Drive, Dropbox, OneDrive), very large files, and advanced server-side processing.</li>
                            <li>Optional Server Storage: If you want us to retain processed data for future work, storage is billed; otherwise, we don't keep your files.</li>
                        </ul>
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
                                        disabled={isCurrentPlan}
                                        onClick={() => handlePlanSelect(plan.id)}
                                    >
                                        {isCurrentPlan ? 'Current Plan' : plan.cta}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {checkoutPlan && (
                        <div className="checkout-panel">
                            <div className="checkout-header">
                                <div>
                                    <h2>Secure Checkout</h2>
                                    <p>Finalizing your {checkoutPlan.name} membership.</p>
                                </div>
                                <button className="btn-close-panel" onClick={() => setCheckoutPlan(null)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="checkout-grid">
                                <div className="checkout-box">
                                    <h3>Order Summary</h3>
                                    <div className="order-summary-card">
                                        <div className="summary-row">
                                            <span>Selected Plan</span>
                                            <span>{checkoutPlan.name}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Price</span>
                                            <span>{checkoutPlan.price} / {checkoutPlan.period}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Applied Discount</span>
                                            <span style={{ color: 'var(--primary-500)' }}>-{discountPercent}%</span>
                                        </div>
                                        <div className="summary-total">
                                            <span>Total Amount</span>
                                            <span>{formatTotal(checkoutTotal)}</span>
                                        </div>
                                    </div>

                                    <div className="coupon-section">
                                        <h3>Coupon Code</h3>
                                        <div className="coupon-row">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                placeholder="Enter code (e.g. DEMO100)"
                                            />
                                            <button className="btn btn-secondary" onClick={applyCoupon}>
                                                Apply
                                            </button>
                                        </div>
                                        <p className="hint">Try <b>DEMO100</b> for a free trial checkout.</p>
                                    </div>
                                </div>

                                <div className="checkout-box">
                                    <h3>Payment Details</h3>
                                    <div className="payment-gateway-card">
                                        <div className="gateway-info">
                                            <CreditCard size={24} color="var(--primary-500)" />
                                            <div>
                                                <strong>Secure Payment via DemoPay</strong>
                                                <p>This is a sandbox environment. No real funds are moved.</p>
                                            </div>
                                        </div>

                                        <div className="payment-fields">
                                            <input type="text" placeholder="Card number: 4242 4242 4242 4242" />
                                            <div className="payment-row">
                                                <input type="text" placeholder="MM / YY" />
                                                <input type="text" placeholder="CVC" />
                                            </div>
                                        </div>

                                        <button
                                            className="btn btn-primary btn-full btn-large"
                                            onClick={handleDemoPayment}
                                            disabled={paymentProcessing}
                                        >
                                            {paymentProcessing ? (
                                                <><Loader size={18} className="spin" /> Processing...</>
                                            ) : (
                                                <>Authorize {formatTotal(checkoutTotal)} Payment</>
                                            )}
                                        </button>

                                        {paymentMessage && (
                                            <div className="payment-message animated fadeIn">
                                                {paymentMessage}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pricing-faq container">
                        <h2 className="faq-title">Privacy, Modes & Technical FAQ</h2>
                        <div className="faq-grid">
                            <div className="faq-item">
                                <h3>Offline vs Online — what’s the difference?</h3>
                                <p><strong>Offline (Local): Free.</strong> Files never leave your device and are processed in your browser. <strong>Online (Server): Paid.</strong> Required for cloud-source uploads (Drive/Dropbox/OneDrive), very large files, or advanced server compute.</p>
                            </div>
                            <div className="faq-item">
                                <h3>Do you keep a copy of my processed files?</h3>
                                <p>By default, <strong>no</strong>. We do not keep server-side copies unless you opt in to <strong>paid server storage</strong> for future reuse. If you don’t opt in, transient server data is discarded after processing.</p>
                            </div>
                            <div className="faq-item">
                                <h3>Is it safe for HIPAA or GDPR compliance?</h3>
                                <p>Offline mode is local-only and maximizes data residency. Online mode follows our server security practices; opt-in storage is configurable per project.</p>
                            </div>
                            <div className="faq-item">
                                <h3>Why is there a file size limit on Free?</h3>
                                <p>Large files can exceed typical browser memory. Free (offline) tools are tuned for stability; Online mode unlocks server resources for heavy workloads.</p>
                            </div>
                            <div className="faq-item">
                                <h3>Can I work offline?</h3>
                                <p>Yes. Once the site is loaded, most tools work offline. Online-only features require an active connection.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default PricingPage;
