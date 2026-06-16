import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createWord, updateWord, deleteWord, fetchWortarten } from '../api/client';
import type { Word } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void; // called after delete; if omitted, delete button is hidden
  word?: Word;            // if set → edit mode
  collectionId?: string;  // if set → new word is also added to this collection
}

const EMPTY_FORM = {
  hiragana: '',
  kanji: '',
  romaji: '',
  deutsch: '',
  wortart: '',
  beispielsatz_jp: '',
  beispielsatz_de: '',
};

export default function WordFormOverlay({ isOpen, onClose, onSaved, onDeleted, word, collectionId }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [wortarten, setWortarten] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!word;

  useEffect(() => {
    fetchWortarten().then(setWortarten);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (word) {
        setForm({
          hiragana: word.hiragana,
          kanji: word.kanji ?? '',
          romaji: word.romaji ?? '',
          deutsch: word.deutsch,
          wortart: word.wortart,
          beispielsatz_jp: word.beispielsatz_jp ?? '',
          beispielsatz_de: word.beispielsatz_de ?? '',
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setError('');
    }
  }, [isOpen, word]);

  const set = (field: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hiragana.trim() || !form.deutsch.trim() || !form.wortart.trim()) {
      setError('Hiragana/Kana, Deutsch und Wortart sind Pflichtfelder.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await updateWord(word!.id, form);
      } else {
        await createWord({ ...form, collectionId });
      }
      onSaved();
      onClose();
    } catch {
      setError('Speichern fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!word) return;
    if (!confirm(`„${word.hiragana}" (${word.deutsch}) wirklich löschen?\nDiese Aktion entfernt die Vokabel aus allen Sammlungen und dem Lernfortschritt.`)) return;
    setDeleting(true);
    try {
      await deleteWord(word.id);
      onDeleted?.();
      onClose();
    } catch {
      setError('Löschen fehlgeschlagen.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 text-lg">
                  {isEdit ? 'Vokabel bearbeiten' : 'Neue Vokabel'}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

                {/* Japanese */}
                <fieldset className="space-y-3">
                  <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Japanisch</legend>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hiragana / Katakana <span className="text-red-500">*</span>
                    </label>
                    <input
                      autoFocus
                      value={form.hiragana}
                      onChange={set('hiragana')}
                      placeholder="ひらがな"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-japanese focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kanji</label>
                      <input
                        value={form.kanji}
                        onChange={set('kanji')}
                        placeholder="漢字"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-japanese focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Romaji</label>
                      <input
                        value={form.romaji}
                        onChange={set('romaji')}
                        placeholder="romaji"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beispielsatz (Japanisch)</label>
                    <textarea
                      value={form.beispielsatz_jp}
                      onChange={set('beispielsatz_jp')}
                      placeholder="例文…"
                      rows={2}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-japanese focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                    />
                  </div>
                </fieldset>

                {/* German */}
                <fieldset className="space-y-3">
                  <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Deutsch</legend>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bedeutung <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.deutsch}
                      onChange={set('deutsch')}
                      placeholder="Deutsch"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wortart <span className="text-red-500">*</span>
                    </label>
                    <input
                      list="wortarten-list"
                      value={form.wortart}
                      onChange={set('wortart')}
                      placeholder="Nomen, Verb, Adjektiv…"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <datalist id="wortarten-list">
                      {wortarten.map((w) => <option key={w} value={w} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beispielsatz (Deutsch)</label>
                    <textarea
                      value={form.beispielsatz_de}
                      onChange={set('beispielsatz_de')}
                      placeholder="Übersetzung des Beispielsatzes…"
                      rows={2}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                    />
                  </div>
                </fieldset>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>
                )}
              </form>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
                {isEdit && onDeleted && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting || saving}
                    className="border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    {deleting ? '…' : 'Löschen'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || deleting}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Speichere…' : isEdit ? 'Speichern' : 'Erstellen'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
