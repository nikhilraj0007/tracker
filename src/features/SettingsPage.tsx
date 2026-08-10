import { CheckCircle2, DatabaseBackup, Download, FileDown, HardDrive, Moon, Palette, RefreshCw, ShieldCheck, Smartphone, Upload } from 'lucide-react';
import { useRef } from 'react';
import type { AppData } from '../domain/types';

interface SettingsPageProps {
  data: AppData;
  canInstall: boolean;
  installed: boolean;
  onInstall: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImport: (file: File) => void;
  onThemeChange: (theme: AppData['preferences']['theme']) => void;
  onReset: () => void;
}

export function SettingsPage({ data, canInstall, installed, onInstall, onExportJson, onExportCsv, onImport, onThemeChange, onReset }: SettingsPageProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="settings-layout">
      <section className="settings-intro"><div><p className="eyebrow">Control centre</p><h2>Make Paisa yours</h2><p>Preferences and financial data stay on this device.</p></div><span><ShieldCheck size={28} /></span></section>
      <section className="settings-section">
        <div className="settings-heading"><Palette size={19} /><div><h3>Appearance</h3><p>Choose the experience that feels clearest.</p></div></div>
        <div className="theme-options">
          {(['light', 'dark', 'system'] as const).map((theme) => <button key={theme} className={data.preferences.theme === theme ? 'active' : ''} onClick={() => onThemeChange(theme)}><span className={`theme-preview ${theme}`}><i /><b /></span><strong>{theme[0].toUpperCase() + theme.slice(1)}</strong>{theme === 'system' && <Moon size={15} />}</button>)}
        </div>
      </section>
      <section className="settings-section install-app-section">
        <div className="settings-heading"><Smartphone size={19} /><div><h3>Install the mobile app</h3><p>Open Paisa from your home screen with an app-like, offline-ready experience.</p></div></div>
        <div className="install-app-card"><span>{installed ? <CheckCircle2 size={21} /> : <Smartphone size={21} />}</span><div><strong>{installed ? 'Installed on this device' : canInstall ? 'Paisa is ready to install' : 'Add Paisa to your home screen'}</strong><small>{installed ? 'You are using the standalone app experience.' : canInstall ? 'Installation keeps your data private in this browser profile.' : 'On iPhone, use Safari Share → Add to Home Screen. On Android, open the browser menu and choose Install app.'}</small></div>{canInstall && !installed && <button className="primary-button" onClick={onInstall}><Download size={16} /> Install</button>}</div>
      </section>
      <section className="settings-section">
        <div className="settings-heading"><DatabaseBackup size={19} /><div><h3>Backup and portability</h3><p>Keep a recoverable copy outside your browser.</p></div></div>
        <div className="settings-action-grid">
          <button onClick={onExportJson}><span><Download size={19} /></span><div><strong>Download backup</strong><small>Complete validated JSON file</small></div></button>
          <button onClick={onExportCsv}><span><FileDown size={19} /></span><div><strong>Export spreadsheet</strong><small>Transactions as Excel-friendly CSV</small></div></button>
          <button onClick={() => fileRef.current?.click()}><span><Upload size={19} /></span><div><strong>Restore backup</strong><small>Validate before replacing local data</small></div></button>
          <input ref={fileRef} hidden type="file" accept="application/json" onChange={(event) => event.target.files?.[0] && onImport(event.target.files[0])} />
        </div>
        <div className="local-data-note"><HardDrive size={18} /><div><strong>Local-only storage</strong><span>{data.transactions.length} transactions · Updated {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.updatedAt))}</span></div></div>
      </section>
      <section className="settings-section danger-zone">
        <div className="settings-heading"><RefreshCw size={19} /><div><h3>Reset template</h3><p>Replace current records and edits with your original ₹80k personal-plan defaults.</p></div></div>
        <button className="danger-outline" onClick={onReset}>Reset to personal defaults</button>
      </section>
      <footer className="settings-footer"><span className="brand-mark small">₹</span><div><strong>Paisa 0.1.0</strong><span>Private money clarity, built for India.</span></div></footer>
    </div>
  );
}
