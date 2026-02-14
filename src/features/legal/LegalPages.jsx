import React from 'react';
import SimplePage from './SimplePage';
import SeoHead from '../../components/meta/SeoHead';

export function PrivacyPage() {
    const content = [
        {
            heading: 'Zero File Collection',
            text: 'AnyFileForge is built on a "Privacy-First" architecture. Unlike traditional online PDF tools, we do not upload your files to our servers. Every byte of data stays on your machine.'
        },
        {
            heading: 'Local-Only Processing',
            text: 'All processing (Merging, Splitting, Converting) is handled by your browser using WebAssembly. Your data residency never leaves your physical device.',
            list: [
                'No server-side storage exists.',
                'No data retention policies apply.',
                'Mathematical privacy guarantee.'
            ]
        },
        {
            heading: 'Third-Party Services',
            text: 'We do not sell your personal information. We use minimal analytics to improve tool performance, but these never include your file content or metadata.'
        }
    ];

    return (
        <>
            <SeoHead
                title="Privacy Policy - AnyFileForge"
                description="We process all files locally. Read our privacy-first commitment to your data security."
            />
            <SimplePage title="Privacy Policy" lastUpdated="February 2026" content={content} />
        </>
    );
}

export function TermsPage() {
    const content = [
        {
            heading: 'Acceptance of Terms',
            text: 'By using AnyFileForge, you agree to these terms. Since we process everything locally, you are responsible for the files you process and any copyright restrictions associated with them.'
        },
        {
            heading: 'Fair Use',
            text: 'AnyFileForge is free for personal and professional use. However, automated scraping or abuse of our client-side infrastructure is prohibited.'
        },
        {
            heading: 'Disclaimer',
            text: 'The tools are provided "as-is". While we use industry-standard libraries, we are not liable for any data loss or corruption that may occur during local processing.'
        }
    ];

    return (
        <>
            <SeoHead
                title="Terms of Service - AnyFileForge"
                description="Usage terms for the AnyFileForge platform. Free for personal and professional use."
            />
            <SimplePage title="Terms of Service" lastUpdated="February 2026" content={content} />
        </>
    );
}

export function LicensePage() {
    const content = [
        {
            heading: 'MIT License',
            text: 'Copyright (c) 2026 AnyFileForge Contributors'
        },
        {
            heading: 'Permission',
            text: 'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.'
        },
        {
            heading: 'Conditions',
            text: 'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.'
        },
        {
            heading: 'Disclaimer',
            text: 'The Software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement.'
        }
    ];

    return (
        <>
            <SeoHead
                title="License - AnyFileForge"
                description="MIT License for the AnyFileForge project."
            />
            <SimplePage title="License" lastUpdated="February 2026" content={content} />
        </>
    );
}
