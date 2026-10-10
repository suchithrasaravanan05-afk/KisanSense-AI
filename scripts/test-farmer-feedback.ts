import { storageService } from '../src/services/storageService';
import { initialActivities } from '../src/data/mockData';
import { translations, getTranslation } from '../src/i18n/translations';
import { FieldActivity } from '../src/types';

// Polyfill window and localStorage for headless Node environment
const mockStorage: Record<string, string> = {};
(global as any).window = global;
(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
};

async function runTests() {
  console.log('================================================================');
  console.log('🧪 KisanSense AI — Farmer Feedback & Activity History Test Suite');
  console.log('================================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, desc: string, details: string = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${desc} - ${details}`);
      failCount++;
    }
  }

  // Reset storage before tests
  storageService.resetToDemoData();

  // -----------------------------------------------------------------------------
  // Section 1: Saving Feedback & Done Status on Saved Recommendation
  // -----------------------------------------------------------------------------
  console.log('📋 Section 1: Saving Feedback & Completion Status (Done & Helpful)');
  const allActivities = storageService.getFieldActivities();
  assert(allActivities.length > 0, `Initial activities loaded (${allActivities.length} items)`);

  const targetActivity = allActivities[0];
  const testDate1 = '2026-10-10T10:00:00.000Z';
  const testNotes1 = 'Sprayed recommended organic Neem formulation. Pests subsided significantly after 3 days.';

  const updatedDone = storageService.saveActivityFeedback(targetActivity.id, {
    completed: true,
    farmer_feedback: 'helpful',
    notes: testNotes1,
    activity_date: testDate1,
  });

  assert(updatedDone !== null, 'Activity updated successfully');
  assert(updatedDone?.completed === true, 'Activity marked as Done (completed=true)');
  assert(updatedDone?.farmer_feedback === 'helpful', 'Recommendation feedback recorded as "helpful"');
  assert(updatedDone?.notes === testNotes1, 'Farmer optional note saved accurately');
  assert(updatedDone?.activity_date === testDate1, 'Custom activity date preserved');

  // -----------------------------------------------------------------------------
  // Section 2: Saving Feedback as "Not done" & "Harmful / Not Helpful"
  // -----------------------------------------------------------------------------
  console.log('\n📋 Section 2: Saving Feedback as "Not done" & Unfavorable/Unsure Outcome');
  const targetActivity2 = allActivities[1];
  const testDate2 = '2026-10-09T14:30:00.000Z';
  const testNotes2 = 'Could not acquire recommended micro-nutrients in local market. Sowing deferred.';

  const updatedNotDone = storageService.saveActivityFeedback(targetActivity2.id, {
    completed: false,
    farmer_feedback: 'harmful',
    notes: testNotes2,
    activity_date: testDate2,
  });

  assert(updatedNotDone !== null, 'Second activity updated successfully');
  assert(updatedNotDone?.completed === false, 'Activity marked as Not done (completed=false)');
  assert(updatedNotDone?.farmer_feedback === 'harmful', 'Recommendation feedback recorded as "harmful / not helpful"');
  assert(updatedNotDone?.notes === testNotes2, 'Optional note recorded for incomplete task');

  // Test "Resolved" and "Unsure" statuses as well
  const updatedResolved = storageService.saveActivityFeedback(targetActivity.id, {
    completed: true,
    farmer_feedback: 'resolved',
  });
  assert(updatedResolved?.farmer_feedback === 'resolved', 'Feedback can be updated to "resolved"');

  const updatedUnsure = storageService.saveActivityFeedback(targetActivity.id, {
    completed: true,
    farmer_feedback: 'unsure',
  });
  assert(updatedUnsure?.farmer_feedback === 'unsure', 'Feedback can be updated to "unsure"');

  // -----------------------------------------------------------------------------
  // Section 3: Refreshing and Data Persistence Across Storage
  // -----------------------------------------------------------------------------
  console.log('\n📋 Section 3: Refreshing and Data Persistence in Storage');
  // Re-read fresh list from storage
  const refreshedActivities = storageService.getFieldActivities();
  const foundRefreshed = refreshedActivities.find((a) => a.id === targetActivity.id);
  const foundRefreshed2 = refreshedActivities.find((a) => a.id === targetActivity2.id);

  assert(foundRefreshed !== undefined, 'Target activity 1 retrieved on storage refresh');
  assert(foundRefreshed?.completed === true, 'Refreshed status persists as Done');
  assert(foundRefreshed?.farmer_feedback === 'unsure', 'Refreshed feedback persists as unsure');
  assert(foundRefreshed?.notes === testNotes1, 'Refreshed notes match saved value');

  assert(foundRefreshed2 !== undefined, 'Target activity 2 retrieved on storage refresh');
  assert(foundRefreshed2?.completed === false, 'Refreshed status persists as Not done');
  assert(foundRefreshed2?.farmer_feedback === 'harmful', 'Refreshed feedback persists as harmful');
  assert(foundRefreshed2?.notes === testNotes2, 'Refreshed notes match saved value');

  // Filter activities by field
  const fieldActivities = storageService.getFieldActivities(targetActivity.field_id);
  assert(fieldActivities.every((a) => a.field_id === targetActivity.field_id), 'Activities properly filtered by field ID');

  // -----------------------------------------------------------------------------
  // Section 4: Creating a New Feedback & Outcome Activity
  // -----------------------------------------------------------------------------
  console.log('\n📋 Section 4: Logging New Standalone Feedback Activity');
  const newActivityData = {
    field_id: targetActivity.field_id,
    type: 'expert_note' as const,
    title: 'Farmer Recommendation Outcome: Drip Irrigation Trial',
    description: 'Farmer executed recommended 4-hour cycle and checked soil moisture.',
    notes: 'Soil wetness penetrated 15cm without surface runoff.',
    activity_date: new Date().toISOString(),
    completed: true,
    farmer_feedback: 'helpful' as const,
  };

  const createdAct = storageService.createFieldActivity(newActivityData);
  assert(createdAct.id.startsWith('act-'), `New activity assigned unique ID (${createdAct.id})`);
  assert(createdAct.completed === true, 'New activity initialized with completed status');
  assert(createdAct.farmer_feedback === 'helpful', 'New activity contains farmer feedback');
  assert(createdAct.notes === newActivityData.notes, 'New activity contains optional notes');

  // Verify it shows up at the top of the refreshed timeline
  const timelineActivities = storageService.getFieldActivities(targetActivity.field_id);
  assert(timelineActivities[0].id === createdAct.id, 'New activity displays at the head of the field timeline');

  // -----------------------------------------------------------------------------
  // Section 5: Agronomic Safety Rule — Non-Proof Disclaimer
  // -----------------------------------------------------------------------------
  console.log('\n📋 Section 5: Agronomic Safety Mandate (Feedback is NOT Proof)');
  const enDisclaimer = getTranslation('en', 'feedbackDisclaimerNotice');
  const hiDisclaimer = getTranslation('hi', 'feedbackDisclaimerNotice');

  assert(
    enDisclaimer.toLowerCase().includes('subjective') && enDisclaimer.toLowerCase().includes('not constitute scientific'),
    'English disclaimer explicitly states feedback is subjective and does NOT constitute scientific proof'
  );
  assert(
    hiDisclaimer.includes('व्यक्तिगत') && (hiDisclaimer.includes('वैज्ञानिक') || hiDisclaimer.includes('प्रमाण नहीं')),
    'Hindi disclaimer warns that feedback is personal observation and not scientific certification'
  );

  // -----------------------------------------------------------------------------
  // Section 6: Bilingual Translation Key Parity (English & Hindi)
  // -----------------------------------------------------------------------------
  console.log('\n📋 Section 6: Bilingual Parity for Feedback UI Elements');
  const requiredFeedbackKeys = [
    'feedbackModalTitle',
    'feedbackModalSubtitle',
    'recommendationStatusLabel',
    'statusDone',
    'statusNotDone',
    'didItHelpLabel',
    'feedbackHelpfulOption',
    'feedbackResolvedOption',
    'feedbackUnsureOption',
    'feedbackHarmfulOption',
    'activityDateLabel',
    'optionalNotesLabel',
    'notesPlaceholder',
    'savingFeedback',
    'saveFeedbackBtn',
    'feedbackSaveSuccess',
    'feedbackSaveError',
    'giveFeedbackBtn',
    'editFeedbackBtn',
    'feedbackDisclaimerNotice',
    'farmerNotesLabel',
    'noFeedbackYet',
    'doneStatusBadge',
    'notDoneStatusBadge',
    'logNewFeedbackActivity',
    'selectActivityOrRec',
    'feedbackModalEmptyPrompt',
  ];

  for (const key of requiredFeedbackKeys) {
    const enVal = translations.en[key];
    const hiVal = translations.hi[key];
    assert(
      typeof enVal === 'string' && enVal.trim().length > 0 &&
      typeof hiVal === 'string' && hiVal.trim().length > 0,
      `Key "${key}" is defined and non-empty in EN and HI`
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
  console.error('Test run failed:', err);
  process.exit(1);
});
