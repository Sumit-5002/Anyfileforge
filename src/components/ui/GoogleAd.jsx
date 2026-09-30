import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Reusable Google AdSense component for React.
 * Automatically handles the loading of ads via the adsbygoogle array.
 * 
 * @param {string} slot - The data-ad-slot ID from your AdSense dashboard.
 * @param {string} format - The data-ad-format (default: 'auto').
 * @param {string} responsive - Whether the ad should be responsive (default: 'true').
 */
const GoogleAd = ({ slot, format = 'auto', responsive = 'true' }) => {
  const { userData } = useAuth();

  // Don't show ads for supporters, enterprise users, or placeholder slots
  const isInvalidSlot = !slot || slot === 'YOUR_AD_SLOT_ID_HERE';

  useEffect(() => {
    if (isInvalidSlot || userData?.tier === 'supporter' || userData?.tier === 'enterprise') return;
    if (typeof window !== 'undefined') {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense injection failed:', e);
      }
    }
  }, [userData?.tier, isInvalidSlot]);

  if (isInvalidSlot || userData?.tier === 'supporter' || userData?.tier === 'enterprise') {
    return null;
  }

  return (
    <div 
      className="ad-container" 
      style={{ 
        overflow: 'hidden', 
        textAlign: 'center', 
        margin: '1.5rem 0',
        minHeight: '90px' 
      }}
    >
      <ins 
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-3466794688549275"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};

export default GoogleAd;
