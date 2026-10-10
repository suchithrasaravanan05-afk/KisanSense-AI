import fs from 'fs';
import path from 'path';
import { formatWeatherAge } from '../src/services/weatherService';
import { formatFileSize, getDataUrlSizeBytes } from '../src/utils/imageCompressor';
import { translations } from '../src/i18n/translations';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 KisanSense AI — Low-Connectivity & Offline PWA Test Suite');
  console.log('================================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✓ ${desc}`);
      passCount++;
    } else {
      console.error(`  ❌ FAILED: ${desc}`);
      failCount++;
    }
  }

  // -----------------------------------------------------------------------------
  // Section 1: PWA Manifest & App Shell Service Worker Integrity
  // -----------------------------------------------------------------------------
  console.log('📋 Section 1: PWA Manifest & Service Worker Assets');

  const manifestPath = path.resolve('public/manifest.json');
  assert(fs.existsSync(manifestPath), 'manifest.json exists in public directory');

  const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  assert(manifestContent.name.includes('KisanSense'), 'Manifest has correct application name');
  assert(manifestContent.short_name === 'KisanSense', 'Manifest has short_name defined');
  assert(manifestContent.display === 'standalone', 'Manifest has standalone display mode');
  assert(manifestContent.start_url === '/', 'Manifest has start_url set to root /');
  assert(manifestContent.theme_color === '#1B5E20', 'Manifest specifies agrarian dark-green theme_color');
  assert(Array.isArray(manifestContent.icons) && manifestContent.icons.length >= 2, 'Manifest defines required icon set');

  const swPath = path.resolve('public/sw.js');
  assert(fs.existsSync(swPath), 'sw.js (Service Worker) exists in public directory');
  const swContent = fs.readFileSync(swPath, 'utf-8');
  assert(swContent.includes('APP_SHELL_ASSETS'), 'Service worker specifies application shell assets to cache');
  assert(swContent.includes('caches.open'), 'Service worker handles caching during install event');
  assert(swContent.includes("request.mode === 'navigate'"), 'Service worker implements offline fallback for navigation requests');
  assert(swContent.includes('_next/static'), 'Service worker caches Next.js static asset bundles');

  // -----------------------------------------------------------------------------
  // Section 2: Stale Weather Tracking & Localization
  // -----------------------------------------------------------------------------
  console.log('\n📋 Section 2: Stale Weather Marking & Humanized Localized Age');

  const now = Date.now();
  const tenMinAgo = new Date(now - 10 * 60 * 1000).toISOString();
  const threeHoursAgo = new Date(now - 3 * 3600 * 1000).toISOString();
  const twoDaysAgo = new Date(now - 48 * 3600 * 1000).toISOString();

  const ageEn10m = formatWeatherAge(tenMinAgo, 'en');
  const ageTa10m = formatWeatherAge(tenMinAgo, 'ta');
  const ageEn3h = formatWeatherAge(threeHoursAgo, 'en');
  const ageTa3h = formatWeatherAge(threeHoursAgo, 'ta');
  const ageEn2d = formatWeatherAge(twoDaysAgo, 'en');
  const ageTa2d = formatWeatherAge(twoDaysAgo, 'ta');

  assert(ageEn10m.includes('10m ago'), `English 10-minute age formatting: "${ageEn10m}"`);
  assert(ageTa10m.includes('10 நிமிடங்களுக்கு முன்'), `Tamil 10-minute age formatting: "${ageTa10m}"`);
  assert(ageEn3h.includes('3h ago'), `English 3-hour age formatting: "${ageEn3h}"`);
  assert(ageTa3h.includes('3 மணிநேரத்திற்கு முன்'), `Tamil 3-hour age formatting: "${ageTa3h}"`);
  assert(ageEn2d.includes('2d ago'), `English 2-day age formatting: "${ageEn2d}"`);
  assert(ageTa2d.includes('2 நாட்களுக்கு முன்'), `Tamil 2-day age formatting: "${ageTa2d}"`);

  // -----------------------------------------------------------------------------
  // Section 3: Image Compressor Utilities & Calculations
  // -----------------------------------------------------------------------------
  console.log('\n📋 Section 3: Client-Side Image Compression Mechanics');

  assert(formatFileSize(500) === '500 B', 'Formats bytes: 500 B');
  assert(formatFileSize(153600) === '150 KB', 'Formats kilobytes: 150 KB');
  assert(formatFileSize(4500000) === '4.3 MB', 'Formats megabytes: 4.3 MB');

  const sampleB64 = 'data:image/jpeg;base64,' + 'A'.repeat(400);
  const calculatedBytes = getDataUrlSizeBytes(sampleB64);
  assert(calculatedBytes > 0, `Calculates DataURL byte payload: ${calculatedBytes} bytes`);

  // -----------------------------------------------------------------------------
  // Section 4: Offline Synchronization Queue & Storage Simulation
  // -----------------------------------------------------------------------------
  console.log('\n📋 Section 4: Storage Service Offline Sync Queue & Recommendation Caching');

  const mockStorage: Record<string, string> = {};
  (global as any).window = {};
  (global as any).localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => { mockStorage[key] = val; },
    removeItem: (key: string) => { delete mockStorage[key]; },
  };

  const { storageService } = await import('../src/services/storageService');

  const initialQueue = storageService.getSyncQueue();
  assert(Array.isArray(initialQueue) && initialQueue.length === 0, 'Initial offline sync queue is empty');

  const queuedField = storageService.enqueueSyncAction({
    action_type: 'create_field',
    title: 'Test Plot East',
    description: '1.5 Acres Tomato',
    payload: { name: 'Test Plot East', area: 1.5 },
  });
  assert(queuedField.id.startsWith('sync-'), 'Generates unique sync ID');
  assert(queuedField.status === 'pending', 'Enqueued action has status: pending');

  const queuedIrrig = storageService.enqueueSyncAction({
    action_type: 'create_activity',
    title: 'Applied 15,000L Drip',
    payload: { volume: 15000 },
  });

  const currentQueue = storageService.getSyncQueue();
  assert(currentQueue.length === 2, `Queue contains 2 pending actions (actual: ${currentQueue.length})`);

  const syncResult = await storageService.processSyncQueue();
  assert(syncResult.synced === 2, `processSyncQueue successfully synced 2 items (actual: ${syncResult.synced})`);

  storageService.saveLatestRecommendations({
    irrigationRec: {
      id: 'rec-test-1',
      field_id: 'f-1',
      crop_name: 'Tomato',
      growth_stage: 'flowering',
      etc_mm: 5.5,
      net_depth_mm: 5.5,
      water_volume_litres: 24500,
      irrigation_time_hours: 8.2,
      recommended_time: '06:00 AM - 09:00 AM',
      efficiency_applied: 0.9,
      is_estimate: true,
      is_demo: false,
      explanation: 'Daily ETc demand calculation',
      tips: ['Irrigate during morning hours'],
      created_at: new Date().toISOString(),
    },
  });

  const cachedRecs = storageService.getLatestRecommendations();
  assert(cachedRecs !== null && cachedRecs.irrigationRec?.water_volume_litres === 24500, 'Successfully persisted and retrieved latest recommendations');

  // -----------------------------------------------------------------------------
  // Section 5: Bilingual Coverage of Offline & PWA Strings
  // -----------------------------------------------------------------------------
  console.log('\n📋 Section 5: Bilingual Coverage (English & Tamil) for Offline Strings');

  const requiredOfflineKeys = [
    'offlineBannerTitle',
    'offlineBannerDesc',
    'onlineRestoredToast',
    'syncStatusTitle',
    'syncStatusAllSynced',
    'syncStatusPendingCount',
    'syncNowBtn',
    'syncingInProgress',
    'staleWeatherBadge',
    'staleWeatherNotice',
    'offlineRecBannerTitle',
    'offlineRecBannerDesc',
    'imageCompressionBadge',
    'imageCompressionDetail',
    'compressedFrom',
    'compressedTo',
    'compressionSavings',
    'queuedItemsList',
    'noQueuedItems',
    'queuedActionAdded',
    'syncQueueModalTitle',
  ];

  for (const key of requiredOfflineKeys) {
    const enVal = translations.en[key];
    const taVal = translations.ta[key];
    assert(
      !!enVal && !!taVal && enVal.trim() !== '' && taVal.trim() !== '',
      `Key "${key}" translated in EN and TA`
    );
  }

  // -----------------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 Test Summary: ${passCount}/${passCount + failCount} PASSED (${failCount} failed)`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
