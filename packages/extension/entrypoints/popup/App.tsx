import { useState, useEffect } from 'react';
import { sendMessage } from '../../lib/messaging';
import { getLocalProfile, saveLocalProfile } from '../../lib/localProfile';
import './App.css';

// Inline types to avoid module resolution issues in extension context
interface DetectedField {
  selector: string;
  tagName: string;
  inputType: string;
  name?: string;
  id?: string;
  label?: string;
  placeholder?: string;
  ariaLabel?: string;
  autocomplete?: string;
  surroundingText?: string;
  required: boolean;
  currentValue?: string;
}

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


// Local heuristic map: field hints → profile keys
const FIELD_MAP: Record<string, keyof UserProfile> = {
  'first_name': 'first_name', 'given-name': 'first_name', 'fname': 'first_name',
  'last_name': 'last_name', 'family-name': 'last_name', 'lname': 'last_name', 'surname': 'last_name',
  'email': 'email', 'e-mail': 'email',
  'phone': 'phone', 'tel': 'phone', 'mobile': 'phone',
  'address': 'address_line_1', 'street': 'address_line_1', 'address_line_1': 'address_line_1',
  'city': 'city', 'town': 'city',
  'state': 'state', 'province': 'state', 'region': 'state',
  'zip': 'zip_code', 'postal': 'zip_code', 'zip_code': 'zip_code', 'postcode': 'zip_code',
  'country': 'country',
  'company': 'company', 'organization': 'company', 'employer': 'company',
  'job': 'job_title', 'title': 'job_title', 'position': 'job_title',
};

function matchField(field: DetectedField, profile: UserProfile): string {
  const hints = [
    field.autocomplete, field.name, field.id, field.label, field.placeholder
  ].map(h => (h || '').toLowerCase().replace(/[\s-]/g, '_'));

  for (const hint of hints) {
    for (const [key, profileKey] of Object.entries(FIELD_MAP)) {
      if (hint.includes(key)) {
        const val = profile[profileKey];
        if (val && typeof val === 'string') return val;
      }
    }
  }
  return '';
}

type View = 'main' | 'profile';

const PROFILE_FIELDS = [
  { key: 'first_name', label: 'First Name', placeholder: 'John' },
  { key: 'last_name', label: 'Last Name', placeholder: 'Doe' },
  { key: 'email', label: 'Email', placeholder: 'john@example.com' },
  { key: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
  { key: 'date_of_birth', label: 'Date of Birth', placeholder: '1999-01-15' },
  { key: 'address_line_1', label: 'Address Line 1', placeholder: '123 MG Road' },
  { key: 'city', label: 'City', placeholder: 'Mumbai' },
  { key: 'state', label: 'State', placeholder: 'Maharashtra' },
  { key: 'zip_code', label: 'ZIP / Postal Code', placeholder: '400001' },
  { key: 'country', label: 'Country', placeholder: 'India' },
  { key: 'company', label: 'Company', placeholder: 'Acme Corp' },
  { key: 'job_title', label: 'Job Title', placeholder: 'Software Engineer' },
] as const;

function App() {
  const [view, setView] = useState<View>('main');
  const [fields, setFields] = useState<DetectedField[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [fillDone, setFillDone] = useState(false);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    getLocalProfile().then(setProfile);
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    setFillDone(false);
    try {
      const response = await sendMessage({ type: 'REQUEST_SCAN' });
      if (response?.type === 'FORM_DETECTED') {
        setFields(response.fields);
      }
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFill = async () => {
    setIsFilling(true);
    try {
      const currentProfile = await getLocalProfile();
      const results = fields
        .map(field => ({
          selector: field.selector,
          value: matchField(field, currentProfile as UserProfile),
          confidence: 1,
          fieldCategory: 'local',
        }))
        .filter(r => r.value); // only fill matched fields

      await sendMessage({ type: 'AUTOFILL_RESULT', results });
      setFillDone(true);
    } catch (err) {
      console.error('Fill failed:', err);
    } finally {
      setIsFilling(false);
    }
  };

  const handleSaveProfile = async () => {
    await saveLocalProfile(profile);
    setSaveMsg('Saved ✓');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  if (view === 'profile') {
    return (
      <div className="popup">
        <div className="header">
          <div className="logo-row">
            <button className="back-btn" onClick={() => setView('main')}>← Back</button>
          </div>
          <h2 className="section-title">My Profile</h2>
        </div>
        <div className="divider" />
        <div className="profile-form">
          {PROFILE_FIELDS.map(({ key, label, placeholder }) => (
            <div className="form-group" key={key}>
              <label className="form-label">{label}</label>
              <input
                className="form-input"
                type="text"
                placeholder={placeholder}
                value={(profile as any)[key] || ''}
                onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={handleSaveProfile}>
            {saveMsg || '💾 Save Profile'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="popup">
      {/* Header */}
      <div className="header">
        <div className="logo-row">
          <span className="logo-icon">👻</span>
          <h1 className="logo-text">FormGhost</h1>
        </div>
        <div className="badge">
          <span className="badge-dot"></span>
          AI Active
        </div>
      </div>
      <div className="divider" />

      {/* Content */}
      <div className="content">
        {fields.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p className="empty-title">No form detected</p>
            <p className="empty-sub">Navigate to a page with a form, then scan.</p>
          </div>
        ) : fillDone ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <p className="empty-title">Form filled!</p>
            <p className="empty-sub">{fields.length} fields were processed from your profile.</p>
          </div>
        ) : (
          <div className="fields-state">
            <p className="fields-title">
              <span className="fields-count">{fields.length}</span> fields detected
            </p>
            <ul className="field-list">
              {fields.slice(0, 6).map((f, i) => (
                <li key={i} className="field-item">
                  <span className="field-dot" />
                  <span className="field-name">{f.label || f.name || f.placeholder || `Field ${i + 1}`}</span>
                  <span className="field-type">{f.inputType || f.tagName}</span>
                </li>
              ))}
              {fields.length > 6 && (
                <li className="field-item more">+{fields.length - 6} more fields</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="actions">
        {fields.length === 0 ? (
          <button className="btn btn-primary" onClick={handleScan} disabled={isScanning}>
            {isScanning ? <><span className="spinner" /> Scanning...</> : <><span>🔍</span> Scan Form</>}
          </button>
        ) : (
          <div className="action-row">
            <button className="btn btn-primary" onClick={handleFill} disabled={isFilling || fillDone}>
              {isFilling ? <><span className="spinner" /> Filling...</> : '⚡ Fill Form'}
            </button>
            <button className="btn btn-secondary" onClick={handleScan} disabled={isScanning}>↺</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="footer">
        <button className="footer-link" onClick={() => { setView('profile'); }}>👤 My Profile</button>
        <button className="footer-link">⚙ Settings</button>
      </div>
    </div>
  );
}

export default App;
