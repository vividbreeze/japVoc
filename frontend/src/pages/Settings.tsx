import { useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

export default function Settings() {
  const { settings, loaded, load, update } = useSettingsStore();

  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Einstellungen</h1>
        <p className="text-sm text-gray-500">Lernmodus anpassen</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">

        {/* Front side */}
        <SettingRow title="Vorderseite der Karte" description="Was auf der Vorderseite angezeigt wird">
          <div className="flex flex-col gap-2 mt-2">
            {[
              { value: 'hiragana', label: 'Hiragana / Kana' },
              { value: 'kanji', label: 'Kanji' },
              { value: 'deutsch', label: 'Deutsch' },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="frontSide"
                  value={value}
                  checked={settings.frontSide === value}
                  onChange={() => update({ frontSide: value as 'hiragana' | 'kanji' | 'deutsch' })}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </SettingRow>

        {/* Show hiragana on back */}
        <SettingRow title="Hiragana/Kana auf Rückseite" description="Kana-Lesung auf der Rückseite anzeigen">
          <Toggle
            checked={settings.showHiragana}
            onChange={(v) => update({ showHiragana: v })}
          />
        </SettingRow>

        {/* Show kanji on back */}
        <SettingRow title="Kanji auf Rückseite" description="Kanji-Schriftzeichen auf der Rückseite anzeigen">
          <Toggle
            checked={settings.showKanji}
            onChange={(v) => update({ showKanji: v })}
          />
        </SettingRow>

        {/* Example sentence */}
        <SettingRow title="Beispielsatz anzeigen" description="Japanischen Beispielsatz auf der Rückseite einblenden">
          <Toggle
            checked={settings.showExampleSentence}
            onChange={(v) => update({ showExampleSentence: v })}
          />
        </SettingRow>

        {/* New words per day */}
        <SettingRow title="Neue Wörter pro Tag" description="Maximale Anzahl neuer Vokabeln in einer Lerneinheit">
          <div className="flex items-center gap-3 mt-2">
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={settings.newWordsPerDay}
              onChange={(e) => update({ newWordsPerDay: Number(e.target.value) })}
              className="flex-1 accent-indigo-600"
            />
            <span className="w-10 text-center font-semibold text-indigo-700">{settings.newWordsPerDay}</span>
          </div>
        </SettingRow>
      </div>

      {/* Preview */}
      <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">Vorschau Einstellungen</p>
        <ul className="text-sm text-indigo-800 space-y-1">
          <li>Vorderseite: <strong>{{hiragana: 'Hiragana / Kana', kanji: 'Kanji', deutsch: 'Deutsch'}[settings.frontSide]}</strong></li>
          <li>Hiragana auf Rückseite: <strong>{settings.showHiragana ? 'Ja' : 'Nein'}</strong></li>
          <li>Kanji auf Rückseite: <strong>{settings.showKanji ? 'Ja' : 'Nein'}</strong></li>
          <li>Beispielsatz: <strong>{settings.showExampleSentence ? 'Ja' : 'Nein'}</strong></li>
          <li>Neue Wörter/Tag: <strong>{settings.newWordsPerDay}</strong></li>
        </ul>
      </div>
    </div>
  );
}

function SettingRow({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-gray-800 text-sm">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-indigo-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
