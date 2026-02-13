import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ShieldCheck, Zap as ZapIcon, Info, Crown, Building } from 'lucide-react';
import { FileUploader, TOOLS } from '../index';
import './ToolDetailPage.css';

function ToolDetailPage() {
    const { t } = useTranslation();
    const { toolId } = useParams();
    const [tool, setTool] = useState(null);

    useEffect(() => {
        // Find tool in any category of any suite (pdf or image)
        let found = null;
        Object.values(TOOLS).forEach(suite => {
            suite.forEach(group => {
                const item = group.tools.find(t => t.id === toolId);
                if (item) {
                    found = { ...item, type: group.category };
                }
            });
        });

        // Fallback for safety
        if (!found && TOOLS.pdf && TOOLS.pdf[0]) {
            found = TOOLS.pdf[0].tools[0];
            found.type = TOOLS.pdf[0].category;
        }

        setTool(found);
    }, [toolId]);

    if (!tool) return null;

    return (
        <div className="tool-detail-page bg-mesh">
            <div className="container">
                <Link to="/" className="back-link">
                    <ArrowLeft size={16} />
                    {t('common.backToTools', 'Back to all tools')}
                </Link>

                <div className="tool-header fade-in">
                    <div className="tool-type-badge">{tool.type}</div>
                    <h1 className="tool-title">{tool.name}</h1>
                    <p className="tool-description">{tool.description}</p>
                </div>

                <div className="uploader-wrapper fade-in">
                    {tool.isPro ? (
                        <div className="premium-gate">
                            <div className="premium-gate-content">
                                <Crown size={48} color="#FFD700" />
                                <h2>{t('common.premiumRequired', 'Premium Access Required')}</h2>
                                <p>{t('common.premiumText', 'This professional tool is available exclusively for AnyFileForge Premium members.')}</p>
                                <div className="gate-actions">
                                    <Link to="/pricing" className="btn btn-primary">{t('common.upgradeBtn', 'Upgrade to Premium')}</Link>
                                    <Link to="/pricing" className="btn btn-secondary">{t('common.learnMore', 'Learn More')}</Link>
                                </div>
                                <ul className="gate-benefits">
                                    <li>✓ {t('common.benefit1', '100% Client-side processing')}</li>
                                    <li>✓ {t('common.benefit2', 'Batch processing unlocked')}</li>
                                    <li>✓ {t('common.benefit3', 'Support development of local-first tools')}</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <FileUploader tool={tool} customLayout={true} />
                    )}
                </div>

                <div className="tool-info-footer container fade-in">
                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-icon-title">
                                <Info size={20} color="var(--primary-500)" />
                                <h3>About {tool.name}</h3>
                            </div>
                            <p>{t('common.toolAboutText', 'This professional tool allows you to process files directly in your browser. No files are uploaded to any server, making it the most secure choice for your sensitive data.')}</p>
                        </div>
                        <div className="info-item">
                            <div className="info-icon-title">
                                <ShieldCheck size={20} color="var(--primary-500)" />
                                <h3>100% Client-Side</h3>
                            </div>
                            <p>{t('common.toolSecurityText', 'We use WebAssembly and modern browser Canvas APIs to process your files locally. Your data residency never leaves your physical machine.')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ToolDetailPage;
