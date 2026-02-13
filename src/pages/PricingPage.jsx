import React, { useState } from 'react';
import { Check, X, Zap, Crown, Rocket, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import { SeoHead } from '../index';
import './PricingPage.css';

function PricingPage() {
    const { user, userData, loginAnonymously } = useAuth();
    const [upgrading, setUpgrading] = useState(false);

    // ... plans array ...

    const handlePlanSelect = async (planId) => {
        // ... (keep existing handlePlanSelect logic) ...
        if (planId === 'enterprise') {
            window.location.href = 'mailto:enterprise@anyfileforge.com';
            return;
        }

        if (planId === 'premium') {
            if (!user) {
                await loginAnonymously();
            }

            setUpgrading(true);
            try {
                await userService.upgradeToPremium(user.uid);
                window.location.reload(); // Refresh to show new status
            } catch (error) {
                console.error('Upgrade error:', error);
            } finally {
                setUpgrading(false);
            }
        }
    };

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
