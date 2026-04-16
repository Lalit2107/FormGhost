export interface UserProfile {
  id: string;                    // UUID, matches auth.uid()
  created_at: string;
  updated_at: string;

  // Personal Info
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;

  // Address
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;

  // Professional
  company?: string;
  job_title?: string;
  linkedin_url?: string;
  website_url?: string;

  // Custom fields (user-defined key-value pairs)
  custom_fields: Record<string, string>;
}
