import { useState } from 'react';
import { sendMessage } from '../../lib/messaging';
import { DetectedField } from '@formghost/shared';
import './App.css';

function App() {
  const [fields, setFields] = useState<DetectedField[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const response = await sendMessage({ type: 'REQUEST_SCAN' });
      if (response?.type === 'FORM_DETECTED') {
        setFields(response.fields);
      }
    } catch (err) {
      console.error('Failed to scan:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFill = async () => {
    // In a real scenario, this would come from the backend + AI
    const mockResults = fields.map(field => ({
      selector: field.selector,
      value: 'Mock Value for ' + (field.label || field.name || 'field'),
      confidence: 1,
      fieldCategory: 'mock'
    }));

    await sendMessage({ type: 'AUTOFILL_RESULT', results: mockResults });
  };

  return (
    <div className="container">
      <header>
        <h1>FormGhost</h1>
        <div className="status-badge">AI Active</div>
      </header>

      <main>
        {fields.length === 0 ? (
          <div className="empty-state">
            <p>No form detected on current page.</p>
            <button onClick={handleScan} disabled={isScanning}>
              {isScanning ? 'Scanning...' : 'Scan Form'}
            </button>
          </div>
        ) : (
          <div className="success-state">
            <p>Detected {fields.length} fields.</p>
            <div className="actions">
              <button className="primary" onClick={handleFill}>Fill Form</button>
              <button className="secondary" onClick={handleScan}>Rescan</button>
            </div>
            <ul className="field-list">
              {fields.slice(0, 5).map((f, i) => (
                <li key={i}>{f.label || f.name || 'Unknown Field'}</li>
              ))}
              {fields.length > 5 && <li>...</li>}
            </ul>
          </div>
        )}
      </main>

      <footer>
        <button className="text-btn">Settings</button>
      </footer>
    </div>
  );
}

export default App;
