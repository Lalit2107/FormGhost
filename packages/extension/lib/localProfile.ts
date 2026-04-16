interface UserProfile {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  company?: string;
  job_title?: string;
  linkedin_url?: string;
  website_url?: string;
  custom_fields: Record<string, string>;
}

const PROFILE_KEY = 'formghost_local_profile';

const EMPTY_PROFILE: UserProfile = {
  id: 'local',
  created_at: '',
  updated_at: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  zip_code: '',
  country: '',
  company: '',
  job_title: '',
  linkedin_url: '',
  website_url: '',
  custom_fields: {},
};

export async function getLocalProfile(): Promise<UserProfile> {
  return new Promise((resolve) => {
    chrome.storage.local.get([PROFILE_KEY], (result) => {
      resolve(result[PROFILE_KEY] ?? EMPTY_PROFILE);
    });
  });
}

export async function saveLocalProfile(profile: Partial<UserProfile>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get([PROFILE_KEY], (result) => {
      const existing = result[PROFILE_KEY] ?? EMPTY_PROFILE;
      const merged = { ...existing, ...profile, updated_at: new Date().toISOString() };
      chrome.storage.local.set({ [PROFILE_KEY]: merged }, resolve);
    });
  });
}

export { EMPTY_PROFILE };
