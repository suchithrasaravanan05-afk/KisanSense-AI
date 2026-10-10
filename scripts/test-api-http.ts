async function runHttpTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('\n======================================================');
  console.log('🌐 Testing /api/scan HTTP Endpoints on Local Server');
  console.log('======================================================\n');

  // 1. GET /api/scan status
  console.log('1. Testing GET /api/scan (Subsystem Status)...');
  const getRes = await fetch(`${baseUrl}/api/scan`);
  const getJson = await getRes.json();
  console.log(`   Status: ${getRes.status} ${getRes.statusText}`);
  console.log(`   Payload:`, JSON.stringify(getJson, null, 2));
  if (getRes.status !== 200 || getJson.status !== 'operational') {
    throw new Error('GET /api/scan failed');
  }

  // 2. POST /api/scan in Demo Mode
  console.log('\n2. Testing POST /api/scan (Demo Mode - Tomato leaf)...');
  const postDemoRes = await fetch(`${baseUrl}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cropName: 'Tomato',
      imageDataUrl: 'data:image/jpeg;base64,mock-tomato-leaf',
      qualityScore: 88,
      provider: 'demo',
    }),
  });
  const postDemoJson = await postDemoRes.json();
  console.log(`   Status: ${postDemoRes.status} ${postDemoRes.statusText}`);
  console.log(`   Category: ${postDemoJson.result_category}, Confidence: ${postDemoJson.confidence}%, Quality: ${postDemoJson.image_quality}`);
  console.log(`   Symptoms (${postDemoJson.observed_symptoms.length}): ${postDemoJson.observed_symptoms[0]}`);
  console.log(`   Next Step: ${postDemoJson.recommended_next_step}`);
  if (postDemoRes.status !== 200 || !postDemoJson.result_category) {
    throw new Error('POST /api/scan demo mode failed');
  }

  // 3. POST /api/scan with simulated Timeout failure (strict)
  console.log('\n3. Testing POST /api/scan (Simulated Timeout Failure -> HTTP 504)...');
  const timeoutRes = await fetch(`${baseUrl}/api/scan?simulate_error=timeout&strict=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cropName: 'Tomato' }),
  });
  const timeoutJson = await timeoutRes.json();
  console.log(`   Status: ${timeoutRes.status} (Expected 504)`);
  console.log(`   Error Code: ${timeoutJson.code}, Error Message: ${timeoutJson.error}`);
  if (timeoutRes.status !== 504 || timeoutJson.code !== 'TIMEOUT') {
    throw new Error(`Expected HTTP 504 TIMEOUT, got ${timeoutRes.status}`);
  }

  // 4. POST /api/scan with simulated Quota Exceeded failure (strict)
  console.log('\n4. Testing POST /api/scan (Simulated Quota Limit -> HTTP 429)...');
  const quotaRes = await fetch(`${baseUrl}/api/scan?simulate_error=quota&strict=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cropName: 'Tomato' }),
  });
  const quotaJson = await quotaRes.json();
  console.log(`   Status: ${quotaRes.status} (Expected 429)`);
  console.log(`   Error Code: ${quotaJson.code}, Error Message: ${quotaJson.error}`);
  if (quotaRes.status !== 429 || quotaJson.code !== 'QUOTA_EXCEEDED') {
    throw new Error(`Expected HTTP 429 QUOTA_EXCEEDED, got ${quotaRes.status}`);
  }

  // 5. POST /api/scan with simulated Invalid JSON failure (strict)
  console.log('\n5. Testing POST /api/scan (Simulated Invalid JSON -> HTTP 502)...');
  const invalidJsonRes = await fetch(`${baseUrl}/api/scan?simulate_error=invalid_json&strict=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cropName: 'Tomato' }),
  });
  const invalidJsonPayload = await invalidJsonRes.json();
  console.log(`   Status: ${invalidJsonRes.status} (Expected 502)`);
  console.log(`   Error Code: ${invalidJsonPayload.code}`);
  if (invalidJsonRes.status !== 502 || invalidJsonPayload.code !== 'INVALID_JSON') {
    throw new Error(`Expected HTTP 502 INVALID_JSON, got ${invalidJsonRes.status}`);
  }

  // 6. POST /api/scan with simulated Upstream API failure (strict)
  console.log('\n6. Testing POST /api/scan (Simulated 500 API Failure)...');
  const apiFailRes = await fetch(`${baseUrl}/api/scan?simulate_error=api_failure&strict=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cropName: 'Tomato' }),
  });
  const apiFailJson = await apiFailRes.json();
  console.log(`   Status: ${apiFailRes.status} (Expected 500)`);
  console.log(`   Error Code: ${apiFailJson.code}, Error Message: ${apiFailJson.error}`);
  if (apiFailRes.status !== 500 || apiFailJson.code !== 'API_FAILURE') {
    throw new Error(`Expected HTTP 500 API_FAILURE, got ${apiFailRes.status}`);
  }

  // 7. POST /api/scan with resilient fallback (strict=false)
  console.log('\n7. Testing POST /api/scan (Resilient Fallback Mode when failure occurs)...');
  const fallbackRes = await fetch(`${baseUrl}/api/scan?simulate_error=timeout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cropName: 'Tomato' }),
  });
  const fallbackJson = await fallbackRes.json();
  console.log(`   Status: ${fallbackRes.status} (Expected 200 with fallback flag)`);
  console.log(`   is_fallback: ${fallbackJson.is_fallback}`);
  console.log(`   warning: ${fallbackJson.warning}`);
  console.log(`   result_category: ${fallbackJson.result_category}`);
  if (fallbackRes.status !== 200 || !fallbackJson.is_fallback) {
    throw new Error('Expected HTTP 200 with is_fallback: true');
  }

  console.log('\n======================================================');
  console.log('✅ ALL HTTP API ENDPOINT TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runHttpTests().catch((err) => {
  console.error('HTTP test failed:', err);
  process.exit(1);
});
