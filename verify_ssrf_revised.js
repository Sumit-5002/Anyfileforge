
async function testSSRF() {
  const url = 'http://localhost:5000/api/image/html-to-image';
  const targetUrl = 'http://localhost:5000/api/health';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: targetUrl,
        format: 'svg'
      })
    });

    if (response.ok) {
      console.log('Test Failed: SSRF success? Status:', response.status);
    } else {
      console.log('Response status (expected error):', response.status, await response.text());
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

async function testExternalURL() {
  const url = 'http://localhost:5000/api/image/html-to-image';
  const targetUrl = 'http://www.google.com';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: targetUrl,
        format: 'svg'
      })
    });

    if (response.ok) {
      const text = await response.text();
      console.log('External URL Response status:', response.status);
      if (text.includes('<svg') && text.includes('Google')) {
        console.log('Legitimate External URL test Passed.');
      } else {
        console.log('External URL content check failed.');
      }
    } else {
      console.log('External URL Response error:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

(async () => {
    await testSSRF();
    await testExternalURL();
})();
