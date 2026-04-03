import React, { useState } from 'react';
import { Check, X, Zap, Crown, Rocket, LoaderCircle, CreditCard, Heart, Coffee, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/userService';
import SeoHead from '../../components/meta/SeoHead';
import './PricingPage.css';

function PricingPage() {
    const { user, userData } = useAuth();
    const [checkoutPlan, setCheckoutPlan] = useState(null);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState('');

    const plans = [
        {
            id: 'free',
            name: 'Pioneer',
            description: 'Free forever. Supported by minimal ads.',
            price: '$0',
            period: 'forever',
            highlighted: false,
            icon: Zap,
            btnText: 'Current Status',
            features: [
                { text: 'All 50+ Serverless tools', included: true },
                { text: 'Privacy-focused processing', included: true },
                { text: 'Ad-supported experience', included: true },
                { text: 'Large file cloud processing', included: false },
                { text: 'Ad-free environment', included: false }
            ]
        },
        {
            id: 'supporter',
            name: 'Supporter',
            description: 'Unlock everything and remove ads with a small donation.',
            price: '$5',
            priceValue: 5,
            period: 'contribution',
            highlighted: true,
            icon: Coffee,
            btnText: 'Support the Dev',
            features: [
                { text: 'Everything in Pioneer', included: true },
                { text: '100% Ad-Free Experience', included: true },
                { text: 'Premium Cloud processing', included: true },
                { text: 'Large file (>1GB) support', included: true },
                { text: 'Priority Feature Requests', included: true }
            ]
        },
        {
            id: 'enterprise',
            name: 'Guardian',
            description: 'For research labs and engineering teams.',
            price: '$20',
            priceValue: 20,
            period: 'contribution+',
            highlighted: false,
            icon: Crown,
            btnText: 'Become a Guardian',
            features: [
                { text: 'Everything in Supporter', included: true },
                { text: 'Team usage license', included: true },
                { text: 'Branded exports', included: true },
                { text: 'Dedicated support channel', included: true },
                { text: 'Early access to new labs', included: true }
            ]
        }
    ];

    const handlePlanSelect = (planId) => {
        if (planId === 'free') return;
        
        if (planId === 'supporter' || planId === 'enterprise') {
            setCheckoutPlan(plans.find((p) => p.id === planId));
            setPaymentMessage('');
        }
    };

    const handleDonationSimulation = async () => {
        if (!user) {
            setPaymentMessage('Please login to link your support to your account.');
            return;
        }

        setPaymentProcessing(true);
        setPaymentMessage('');
        try {
            // Simulated donation -> Supporter activation
            await userService.upgradeToSupporter(user.uid);
            setPaymentMessage('Thank you for your generous support! Supporter features activated.');
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            console.error('Donation error:', error);
            setPaymentMessage('Processing failed. Please try again later.');
        } finally {
            setPaymentProcessing(false);
        }
    };

    return (
        <>
            <SeoHead
                title="Support & Premium - AnyFileForge"
                description="Support open-source development and unlock premium features. No ads, cloud processing, and prioritized support."
            />
            <div className="pricing-page donation-mode">
                <div className="container">
                    <div className="page-header">
                        <div className="heart-badge float">
                            <Heart size={14} fill="currentColor" />
                            <span>Fuel the Forge</span>
                        </div>
                        <h1 className="page-title">Support One-Man Development</h1>
                        <p className="page-subtitle">
                           AnyFileForge is a labor of love. Your donations help pay for server costs, keep the tools free for all, and unlock an ad-free premium environment for you.
                        </p>
                        
                        <div className="donation-stats">
                            <div className="stat-item">
                                <span className="stat-label">Current Tier</span>
                                <span className="stat-value">{userData?.tier?.toUpperCase() || 'PIONEER'}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Ad Status</span>
                                <span className={`stat-value ${userData?.tier === 'supporter' ? 'safe' : 'active'}`}>
                                    {userData?.tier === 'supporter' ? 'Disabled 🛡️' : 'Enabled 📢'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pricing-grid">
                        {plans.map((plan, index) => {
                            const isCurrent = (userData?.tier === plan.id) || (!userData?.tier && plan.id === 'free');
                            
                            return (
                                <div
                                    key={index}
                                    className={`pricing-card card ${plan.highlighted ? 'highlighted' : ''} ${isCurrent ? 'current' : ''}`}
                                >
                                    <div className="plan-header">
                                        <div className="plan-icon">
                                            <plan.icon size={32} />
                                        </div>
                                        <h3 className="plan-name">{plan.name}</h3>
                                        <p className="plan-description">{plan.description}</p>
                                    </div>

                                    <div className="plan-price">
                                        <span className="price">{plan.price}</span>
                                        <span className="period">/ {plan.period}</span>
                                    </div>

                                    <ul className="features-list">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className={`feature-item ${feature.included ? 'included' : 'excluded'}`}>
                                                {feature.included ? <Check size={18} /> : <X size={18} />}
                                                <span>{feature.text}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'} btn-full`}
                                        disabled={isCurrent}
                                        onClick={() => handlePlanSelect(plan.id)}
                                    >
                                        {isCurrent ? 'Current Status' : plan.btnText}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {checkoutPlan && (
                        <div className="checkout-panel">
                            <div className="checkout-header">
                                <div>
                                    <h2>Complete Your Donation</h2>
                                    <p>Your support directly funds the AnyFileForge project.</p>
                                </div>
                                <button className="btn-close-panel" onClick={() => setCheckoutPlan(null)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="checkout-grid">
                                <div className="checkout-box">
                                    <h3>Contribution Summary</h3>
                                    <div className="order-summary-card">
                                        <div className="summary-row">
                                            <span>Tier Selection</span>
                                            <span>{checkoutPlan.name}</span>
                                        </div>
                                        <div className="summary-total">
                                            <span>One-time Donation</span>
                                            <span>{checkoutPlan.price}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="premium-perks-box">
                                        <h4>Unlocking Perks:</h4>
                                        <ul>
                                            <li><Shield size={14} /> 100% Ad-Free UI</li>
                                            <li><Zap size={14} /> Cloud Processing Enabled</li>
                                            <li><Heart size={14} /> Dev Gratitude</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="checkout-box">
                                    <h3>Method of Support</h3>
                                    <div className="payment-gateway-card">
                                        <div className="gateway-info">
                                            <Coffee size={24} color="var(--primary-500)" />
                                            <div>
                                                <strong>Buy Me a Coffee</strong>
                                                <p>Secure contribution via processing partner.</p>
                                            </div>
                                        </div>

                                        <div className="payment-fields">
                                            <input type="text" placeholder="Your Name (Optional)" />
                                            <textarea placeholder="Message for the dev... (Optional)" rows="2"></textarea>
                                        </div>

                                        <button
                                            className="btn btn-primary btn-full btn-large"
                                            onClick={handleDonationSimulation}
                                            disabled={paymentProcessing}
                                        >
                                            {paymentProcessing ? (
                                                <><LoaderCircle size={18} className="spin" /> Sending...</>
                                            ) : (
                                                <>Contribute {checkoutPlan.price}</>
                                            )}
                                        </button>

                                        {paymentMessage && (
                                            <div className={`payment-message ${paymentMessage.includes('failed') ? 'error' : 'success'}`}>
                                                {paymentMessage}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pricing-faq container">
                        <h2 className="faq-title">Supporter FAQ</h2>
                        <div className="faq-grid">
                            <div className="faq-item">
                                <h3>Where does my money go?</h3>
                                <p>100% of donations go towards covering the costs of hosting servers, API fees for cloud processing, and maintaining the open-source codebase of AnyFileForge.</p>
                            </div>
                            <div className="faq-item">
                                <h3>Is the "Premium" permanent?</h3>
                                <p>Currently, any donation of $5 or more unlocks Premium features for 30 days. Donations of $20 or more unlock them for a full year.</p>
                            </div>
                            <div className="faq-item">
                                <h3>I can't donate right now, can I still use the tools?</h3>
                                <p>Absolutely. All tools are free and offline-capable. You only see minimal ads to help us keep the lights on.</p>
                            </div>
                            <div className="faq-item">
                                <h3>How do I remove ads?</h3>
                                <p>Once you donate and your account is upgraded to Supporter status, all ads are automatically removed from your dashboard and tools.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default PricingPage;
