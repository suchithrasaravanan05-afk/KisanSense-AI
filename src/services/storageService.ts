import {
  User,
  Field,
  Crop,
  SoilTest,
  ScanResult,
  FieldActivity,
  ExpertReview,
  Language,
  WeatherData,
  IrrigationRecommendation,
  FertilizerRecommendation,
  QueuedSyncItem,
  CachedRecommendations,
} from '../types';
import {
  initialUser,
  initialFields,
  initialCrops,
  initialSoilTests,
  initialScanResults,
  initialActivities,
  initialExpertReviews,
} from '../data/mockData';

const STORAGE_KEYS = {
  USER: 'kisansense_user',
  FIELDS: 'kisansense_fields',
  CROPS: 'kisansense_crops',
  SOIL_TESTS: 'kisansense_soil_tests',
  SCAN_RESULTS: 'kisansense_scan_results',
  ACTIVITIES: 'kisansense_activities',
  EXPERT_REVIEWS: 'kisansense_expert_reviews',
  ACTIVE_FIELD_ID: 'kisansense_active_field_id',
  LANGUAGE: 'kisansense_lang',
  DEMO_MODE: 'kisansense_demo_mode',
  SYNC_QUEUE: 'kisansense_sync_queue',
  CACHED_WEATHER: 'kisansense_cached_weather',
  LATEST_RECOMMENDATIONS: 'kisansense_latest_recommendations',
};

// Safe JSON parser for localStorage
const getStored = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
};

const setStored = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
};

export const storageService = {
  getUser(): User {
    return getStored<User>(STORAGE_KEYS.USER, initialUser);
  },

  updateUser(user: Partial<User>): User {
    const current = this.getUser();
    const updated = { ...current, ...user };
    setStored(STORAGE_KEYS.USER, updated);
    return updated;
  },

  getLanguage(): Language {
    if (typeof window === 'undefined') return 'en';
    const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (stored === 'ta' || stored === 'hi' || stored === 'en') {
      return stored as Language;
    }
    const user = this.getUser();
    return (user.language === 'ta' ? 'ta' : user.language === 'hi' ? 'hi' : 'en');
  },

  setLanguage(lang: Language): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    }
    this.updateUser({ language: lang });
  },

  getFields(): Field[] {
    const fields = getStored<Field[]>(STORAGE_KEYS.FIELDS, []);
    if (fields.length === 0) {
      this.resetToDemoData();
      return initialFields;
    }
    return fields;
  },

  getActiveFieldId(): string {
    const fields = this.getFields();
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACTIVE_FIELD_ID) : null;
    if (stored && fields.some((f) => f.id === stored)) {
      return stored;
    }
    return fields[0]?.id || '';
  },

  setActiveFieldId(id: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_FIELD_ID, id);
    }
  },

  createField(fieldData: Omit<Field, 'id' | 'created_at'>): Field {
    const fields = this.getFields();
    const newField: Field = {
      ...fieldData,
      id: `field-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [newField, ...fields];
    setStored(STORAGE_KEYS.FIELDS, updated);
    this.setActiveFieldId(newField.id);
    return newField;
  },

  deleteField(id: string): void {
    const fields = this.getFields().filter((f) => f.id !== id);
    setStored(STORAGE_KEYS.FIELDS, fields);
    if (this.getActiveFieldId() === id && fields.length > 0) {
      this.setActiveFieldId(fields[0].id);
    }
  },

  getCrops(): Crop[] {
    return getStored<Crop[]>(STORAGE_KEYS.CROPS, initialCrops);
  },

  getCropForField(fieldId: string): Crop | undefined {
    return this.getCrops().find((c) => c.field_id === fieldId);
  },

  createCrop(cropData: Omit<Crop, 'id'>): Crop {
    const crops = this.getCrops().filter((c) => c.field_id !== cropData.field_id);
    const newCrop: Crop = {
      ...cropData,
      id: `crop-${Date.now()}`,
    };
    const updated = [newCrop, ...crops];
    setStored(STORAGE_KEYS.CROPS, updated);
    return newCrop;
  },

  getSoilTests(): SoilTest[] {
    return getStored<SoilTest[]>(STORAGE_KEYS.SOIL_TESTS, initialSoilTests);
  },

  getSoilTestForField(fieldId: string): SoilTest | undefined {
    return this.getSoilTests().find((st) => st.field_id === fieldId);
  },

  createSoilTest(testData: Omit<SoilTest, 'id'>): SoilTest {
    const tests = this.getSoilTests().filter((st) => st.field_id !== testData.field_id);
    const newTest: SoilTest = {
      ...testData,
      id: `soil-${Date.now()}`,
    };
    const updated = [newTest, ...tests];
    setStored(STORAGE_KEYS.SOIL_TESTS, updated);

    // Also automatically log to timeline
    this.createFieldActivity({
      field_id: testData.field_id,
      type: 'soil_test',
      title: 'New Soil Test Report Recorded',
      description: `pH: ${testData.ph ?? 'N/A'}, Available N: ${testData.nitrogen ?? 'N/A'} kg/ha, P: ${testData.phosphorus ?? 'N/A'} kg/ha, K: ${testData.potassium ?? 'N/A'} kg/ha`,
      activity_date: testData.test_date,
      completed: true,
    });

    return newTest;
  },

  getScanResults(): ScanResult[] {
    return getStored<ScanResult[]>(STORAGE_KEYS.SCAN_RESULTS, initialScanResults);
  },

  createScanResult(scanData: Omit<ScanResult, 'id' | 'created_at'>): ScanResult {
    const scans = this.getScanResults();
    const newScan: ScanResult = {
      ...scanData,
      id: `scan-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [newScan, ...scans];
    setStored(STORAGE_KEYS.SCAN_RESULTS, updated);
    return newScan;
  },

  getFieldActivities(fieldId?: string): FieldActivity[] {
    const activities = getStored<FieldActivity[]>(STORAGE_KEYS.ACTIVITIES, initialActivities);
    if (!fieldId) return activities;
    return activities.filter((a) => a.field_id === fieldId);
  },

  createFieldActivity(actData: Omit<FieldActivity, 'id'>): FieldActivity {
    const activities = this.getFieldActivities();
    const newAct: FieldActivity = {
      ...actData,
      id: `act-${Date.now()}`,
    };
    const updated = [newAct, ...activities];
    setStored(STORAGE_KEYS.ACTIVITIES, updated);
    return newAct;
  },

  updateFieldActivity(id: string, updates: Partial<FieldActivity>): FieldActivity | null {
    const activities = this.getFieldActivities();
    const index = activities.findIndex((a) => a.id === id);
    if (index === -1) return null;
    activities[index] = { ...activities[index], ...updates };
    setStored(STORAGE_KEYS.ACTIVITIES, activities);
    return activities[index];
  },

  getExpertReviews(): ExpertReview[] {
    return getStored<ExpertReview[]>(STORAGE_KEYS.EXPERT_REVIEWS, initialExpertReviews);
  },

  createExpertReview(reviewData: Omit<ExpertReview, 'id' | 'created_at'>): ExpertReview {
    const reviews = this.getExpertReviews();
    const newReview: ExpertReview = {
      ...reviewData,
      id: `review-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [newReview, ...reviews];
    setStored(STORAGE_KEYS.EXPERT_REVIEWS, updated);

    // Also post an activity to farmer field timeline
    this.createFieldActivity({
      field_id: reviewData.field_id,
      type: 'expert_note',
      title: 'Agronomic Expert Review Received',
      description: `Expert diagnosis: ${reviewData.corrected_result}. Notes: ${reviewData.expert_notes}`,
      activity_date: new Date().toISOString(),
      completed: true,
      image_url: reviewData.image_url,
    });

    return newReview;
  },

  updateExpertReview(id: string, updates: Partial<ExpertReview>): ExpertReview | null {
    const reviews = this.getExpertReviews();
    const index = reviews.findIndex((r) => r.id === id);
    if (index === -1) return null;
    reviews[index] = { ...reviews[index], ...updates };
    setStored(STORAGE_KEYS.EXPERT_REVIEWS, reviews);
    return reviews[index];
  },

  // --- Offline Sync Queue ---
  getSyncQueue(): QueuedSyncItem[] {
    return getStored<QueuedSyncItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);
  },

  enqueueSyncAction(action: Omit<QueuedSyncItem, 'id' | 'created_at' | 'status'>): QueuedSyncItem {
    const queue = this.getSyncQueue();
    const newItem: QueuedSyncItem = {
      ...action,
      id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      status: 'pending',
    };
    const updated = [newItem, ...queue];
    setStored(STORAGE_KEYS.SYNC_QUEUE, updated);
    return newItem;
  },

  updateSyncItem(id: string, updates: Partial<QueuedSyncItem>): void {
    const queue = this.getSyncQueue();
    const index = queue.findIndex((q) => q.id === id);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      setStored(STORAGE_KEYS.SYNC_QUEUE, queue);
    }
  },

  removeSyncItem(id: string): void {
    const queue = this.getSyncQueue().filter((q) => q.id !== id);
    setStored(STORAGE_KEYS.SYNC_QUEUE, queue);
  },

  clearSyncQueue(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
    }
  },

  async processSyncQueue(): Promise<{ synced: number; failed: number }> {
    const queue = this.getSyncQueue();
    let synced = 0;
    let failed = 0;

    const updatedQueue: QueuedSyncItem[] = [];

    for (const item of queue) {
      if (item.status === 'synced') {
        continue; // drop or skip already synced
      }

      try {
        // Process offline item and ensure it is reconciled
        item.status = 'syncing';
        // Simulate remote server sync delay
        await new Promise((resolve) => setTimeout(resolve, 80));

        item.status = 'synced';
        synced++;
      } catch (err: any) {
        item.status = 'failed';
        failed++;
        updatedQueue.push(item);
      }
    }

    setStored(STORAGE_KEYS.SYNC_QUEUE, updatedQueue);
    return { synced, failed };
  },

  // --- Offline Recommendations Caching ---
  saveLatestRecommendations(recs: {
    irrigationRec?: IrrigationRecommendation;
    fertilizerRec?: FertilizerRecommendation;
  }): void {
    const current = this.getLatestRecommendations() || { cached_at: new Date().toISOString() };
    const payload: CachedRecommendations = {
      irrigationRec: recs.irrigationRec ?? current.irrigationRec,
      fertilizerRec: recs.fertilizerRec ?? current.fertilizerRec,
      cached_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.LATEST_RECOMMENDATIONS, payload);
  },

  getLatestRecommendations(): CachedRecommendations | null {
    return getStored<CachedRecommendations | null>(STORAGE_KEYS.LATEST_RECOMMENDATIONS, null);
  },

  // --- Offline Weather Caching ---
  getCachedWeather(): WeatherData | null {
    return getStored<WeatherData | null>(STORAGE_KEYS.CACHED_WEATHER, null);
  },

  setCachedWeather(weather: WeatherData): void {
    setStored(STORAGE_KEYS.CACHED_WEATHER, weather);
  },

  resetToDemoData(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(initialUser));
    localStorage.setItem(STORAGE_KEYS.FIELDS, JSON.stringify(initialFields));
    localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(initialCrops));
    localStorage.setItem(STORAGE_KEYS.SOIL_TESTS, JSON.stringify(initialSoilTests));
    localStorage.setItem(STORAGE_KEYS.SCAN_RESULTS, JSON.stringify(initialScanResults));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(initialActivities));
    localStorage.setItem(STORAGE_KEYS.EXPERT_REVIEWS, JSON.stringify(initialExpertReviews));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_FIELD_ID, initialFields[0].id);
  },
};
