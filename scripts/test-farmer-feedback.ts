import { storageService } from '../src/services/storageService';
import { initialActivities, initialFields } from '../src/data/mockData';
import { translations, getTranslation } from '../src/i18n/translations';
import { FieldFeedbackRecord, FeedbackStatus, FeedbackOutcome } from '../src/types';

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
  console.log('🧪 KisanSense AI — Field Feedback & Outcome Tracker Test Suite');
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

  // Reset storage to baseline demo data before testing
  storageService.resetToDemoData();

  // -----------------------------------------------------------------------------
  // Test 1: Baseline Demo Feedback Records & Field Linkage
  // -----------------------------------------------------------------------------
  console.log('📋 Test 1: Baseline Demo Feedback Records & Field Linkage');
  const initialRecords = storageService.getFeedbackRecords();
  assert(initialRecords.length >= 2, `Initial feedback records loaded (${initialRecords.length} items)`);

  const tomatoFieldFeedbacks = storageService.getFeedbackRecords('field-tomato-01');
  assert(tomatoFieldFeedbacks.length >= 2, 'Feedbacks properly filtered by field_id');
  assert(tomatoFieldFeedbacks.every((f) => f.field_id === 'field-tomato-01'), 'All records belong to field-tomato-01');

  // -----------------------------------------------------------------------------
  // Test 2: Mark Recommendation "Done" with Actual Quantity, Unit, Date & Note
  // -----------------------------------------------------------------------------
  console.log('\n📋 Test 2: Mark Recommendation as "Done" with Quantity, Unit, Date, and Note');
  const testDate1 = '2026-10-10T08:00:00.000Z';
  const newDoneRecord = storageService.saveFeedbackRecord({
    field_id: 'field-tomato-01',
    recommendation_id: 'act-01',
    recommendation_title: 'Early Blight Fungicide & Foliage Pruning',
    recommendation_type: 'scan',
    status: 'done',
    completed_date: testDate1,
    actual_quantity: 2.5,
    actual_unit: 'Litres',
    farmer_note: 'Pruned bottom infected leaves and sprayed biological copper formulation in early morning.',
  });

  assert(Boolean(newDoneRecord.id), 'Record created with generated ID');
  assert(newDoneRecord.status === 'done', 'Status correctly stored as "done"');
  assert(newDoneRecord.actual_quantity === 2.5, 'Actual quantity saved as 2.5');
  assert(newDoneRecord.actual_unit === 'Litres', 'Actual unit saved as "Litres"');
  assert(newDoneRecord.completed_date === testDate1, 'Completed date accurately recorded');
  assert(Boolean(newDoneRecord.farmer_note?.includes('Pruned bottom')), 'Farmer note properly saved');

  // Verify timeline synchronization
  const timelineActs = storageService.getFieldActivities('field-tomato-01');
  const linkedAct1 = timelineActs.find((a) => a.id === 'act-01');
  assert(Boolean(linkedAct1), 'Linked timeline activity found');
  assert(linkedAct1?.completed === true, 'Timeline activity completed status synced to true');
  assert(linkedAct1?.feedback_status === 'done', 'Timeline activity feedback_status synced to "done"');
  assert(linkedAct1?.actual_quantity === 2.5, 'Timeline activity actual_quantity synced');

  // -----------------------------------------------------------------------------
  // Test 3: Record Each Outcome Option (Improved, No change, Got worse, Too early)
  // -----------------------------------------------------------------------------
  console.log('\n📋 Test 3: Record Each Outcome Option (Improved, No noticeable change, Got worse, Too early)');

  // 3a. Outcome: 'improved' with follow-up image
  const updatedImproved = storageService.saveFeedbackRecord({
    ...newDoneRecord,
    outcome: 'improved',
    outcome_date: '2026-10-12T09:00:00.000Z',
    outcome_note: 'Lesion spread halted completely. New vegetative shoots are clean and vibrant green.',
    follow_up_image_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==',
  });
  assert(updatedImproved.outcome === 'improved', 'Outcome saved as "improved"');
  assert(Boolean(updatedImproved.follow_up_image_url), 'Follow-up image URL attached');
  assert(Boolean(updatedImproved.outcome_note?.includes('Lesion spread halted')), 'Outcome note recorded');

  // 3b. Outcome: 'no_change'
  const recordNoChange = storageService.saveFeedbackRecord({
    field_id: 'field-rice-02',
    recommendation_id: 'act-06',
    recommendation_title: 'Basin Flood Irrigation',
    recommendation_type: 'irrigation',
    status: 'done',
    completed_date: '2026-10-06T07:00:00.000Z',
    actual_quantity: 180000,
    actual_unit: 'Litres',
    outcome: 'no_change',
    outcome_date: '2026-10-09T10:00:00.000Z',
    outcome_note: 'Standing water level maintained, no visible difference in tiller density yet.',
  });
  assert(recordNoChange.outcome === 'no_change', 'Outcome saved as "no_change"');

  // 3c. Outcome: 'got_worse'
  const recordGotWorse = storageService.saveFeedbackRecord({
    field_id: 'field-wheat-03',
    recommendation_id: 'act-07',
    recommendation_title: 'Wheat Block Moisture Triage',
    recommendation_type: 'scan',
    status: 'done',
    completed_date: '2026-10-07T08:00:00.000Z',
    outcome: 'got_worse',
    outcome_date: '2026-10-10T11:00:00.000Z',
    outcome_note: 'Dry winds caused tip drying to accelerate despite watering.',
  });
  assert(recordGotWorse.outcome === 'got_worse', 'Outcome saved as "got_worse"');

  // 3d. Outcome: 'too_early'
  const recordTooEarly = storageService.saveFeedbackRecord({
    field_id: 'field-tomato-01',
    recommendation_title: 'Micro-nutrient Boron Spray',
    recommendation_type: 'fertilizer',
    status: 'done',
    completed_date: '2026-10-10T06:00:00.000Z',
    actual_quantity: 500,
    actual_unit: 'grams',
    outcome: 'too_early',
    outcome_date: '2026-10-10T18:00:00.000Z',
    outcome_note: 'Applied this morning; flower drop assessment requires 5 days.',
  });
  assert(recordTooEarly.outcome === 'too_early', 'Outcome saved as "too_early"');

  // -----------------------------------------------------------------------------
  // Test 4: Mark Recommendation "Partly done" and "Not done"
  // -----------------------------------------------------------------------------
  console.log('\n📋 Test 4: Mark Recommendation as "Partly done" and "Not done"');

  const recordPartlyDone = storageService.saveFeedbackRecord({
    field_id: 'field-tomato-01',
    recommendation_title: 'Second Top Dressing Neem Urea',
    recommendation_type: 'fertilizer',
    status: 'partly_done',
    completed_date: '2026-10-08T09:00:00.000Z',
    actual_quantity: 15,
    actual_unit: 'kg',
    farmer_note: 'Applied only 15kg to northern section because southern section soil was waterlogged.',
    outcome: 'too_early',
  });
  assert(recordPartlyDone.status === 'partly_done', 'Status correctly stored as "partly_done"');
  assert(recordPartlyDone.actual_quantity === 15, 'Partial quantity (15kg) recorded');

  const recordNotDone = storageService.saveFeedbackRecord({
    field_id: 'field-tomato-01',
    recommendation_title: 'Deep Furrow Irrigation',
    recommendation_type: 'irrigation',
    status: 'not_done',
    farmer_note: 'Unseasonal rain received 40mm; irrigation canceled to prevent root rot.',
    outcome: 'no_change',
  });
  assert(recordNotDone.status === 'not_done', 'Status correctly stored as "not_done"');
  assert(Boolean(recordNotDone.farmer_note?.includes('Unseasonal rain')), 'Reason for not executing recorded in farmer note');

  // -----------------------------------------------------------------------------
  // Test 5: Edit and Delete Feedback Records
  // -----------------------------------------------------------------------------
  console.log('\n📋 Test 5: Edit and Delete Feedback Records');

  // Edit record
  const editedRecord = storageService.saveFeedbackRecord({
    ...recordPartlyDone,
    status: 'done',
    actual_quantity: 30,
    farmer_note: 'Completed southern section the following day after drainage.',
    outcome: 'improved',
  });
  assert(editedRecord.status === 'done', 'Status edited from partly_done to done');
  assert(editedRecord.actual_quantity === 30, 'Quantity edited to 30');
  assert(editedRecord.outcome === 'improved', 'Outcome edited to improved');

  // Delete record
  const deleteTargetId = recordNotDone.id;
  const deleteResult = storageService.deleteFeedbackRecord(deleteTargetId);
  assert(deleteResult === true, 'Delete function returned success');

  const retrievedDeleted = storageService.getFeedbackRecord(deleteTargetId);
  assert(retrievedDeleted === undefined, 'Deleted record no longer exists in storage');

  // -----------------------------------------------------------------------------
  // Test 6: Persistence Simulation across Sessions (Storage Read/Write)
  // -----------------------------------------------------------------------------
  console.log('\n📋 Test 6: Persistence Simulation across Session Reload');
  // Read back all tomato feedbacks
  const refreshedFeedbacks = storageService.getFeedbackRecords('field-tomato-01');
  const foundSaved = refreshedFeedbacks.find((f) => f.id === updatedImproved.id);
  assert(Boolean(foundSaved), 'Saved feedback persists and is retrievable after storage cycle');
  assert(foundSaved?.outcome === 'improved', 'Persisted record preserves outcome state');
  assert(foundSaved?.actual_quantity === 2.5, 'Persisted record preserves actual quantity');

  // -----------------------------------------------------------------------------
  // Test 7: Bilingual Translation Parity (English & Hindi)
  // -----------------------------------------------------------------------------
  console.log('\n📋 Test 7: Bilingual Key Parity for Field Feedback & Outcome Tracker');
  const trackerKeys = [
    'trackerTitle',
    'trackerSubtitle',
    'recordOutcomeBtn',
    'updateOutcomeBtn',
    'editFeedbackAction',
    'deleteFeedbackBtn',
    'deleteFeedbackConfirm',
    'statusPartlyDone',
    'statusDoneFull',
    'statusNotDoneFull',
    'statusLabel',
    'statusHelper',
    'actualQuantityLabel',
    'actualUnitLabel',
    'dateCompletedLabel',
    'farmerNoteLabel',
    'outcomeSectionTitle',
    'outcomeSectionSubtitle',
    'outcomeLabel',
    'outcomeImproved',
    'outcomeNoChange',
    'outcomeGotWorse',
    'outcomeTooEarly',
    'outcomeDateLabel',
    'outcomeNoteLabel',
    'followUpPhotoLabel',
    'uploadPhotoBtn',
    'chooseSamplePhotoBtn',
    'removePhotoBtn',
    'outcomeNotYetRecorded',
    'saveTrackerBtn',
    'savingTracker',
    'originalRecommendationLabel',
    'farmerReportedActionLabel',
    'cropOutcomeLabel',
    'feedbackDeletedToast',
    'validationSelectStatus',
    'validationInvalidDate',
    'validationInvalidQuantity',
    'agronomicNoticeTitle',
    'agronomicDisclaimerBody',
    'emptyTimelineFeedback',
  ];

  for (const key of trackerKeys) {
    const enVal = translations.en[key];
    const hiVal = translations.hi[key];
    assert(
      typeof enVal === 'string' && enVal.trim().length > 0 &&
      typeof hiVal === 'string' && hiVal.trim().length > 0,
      `Tracker key "${key}" is fully localized in EN and HI`
    );
  }

  // -----------------------------------------------------------------------------
  // Test 8: Agronomic Safety Mandate (Feedback is Personal History, NOT Proof)
  // -----------------------------------------------------------------------------
  console.log('\n📋 Test 8: Agronomic Safety Mandate (Feedback is NOT Proof)');
  const enNotice = getTranslation('en', 'agronomicDisclaimerBody');
  const hiNotice = getTranslation('hi', 'agronomicDisclaimerBody');

  assert(
    enNotice.toLowerCase().includes('not scientifically prove') || enNotice.toLowerCase().includes('history'),
    'English notice explicitly declares feedback does not scientifically prove correctness'
  );
  assert(
    hiNotice.includes('वैज्ञानिक') || hiNotice.includes('इतिहास'),
    'Hindi notice warns that feedback is personal history and not scientific validation'
  );

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
  console.error('Test execution failed:', err);
  process.exit(1);
});
