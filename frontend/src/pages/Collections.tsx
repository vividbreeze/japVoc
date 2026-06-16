import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchCollections, createCollection, updateCollection, deleteCollection,
  fetchCollectionWords, fetchWords, addWordToCollection, removeWordFromCollection,
} from '../api/client';
import WordFormOverlay from '../components/WordFormOverlay';
import type { Collection, Word } from '../types';

// ─── Word Manager Modal ──────────────────────────────────────────────────────

interface WordManagerProps {
  collection: Collection;
  onClose: () => void;
  onWordCountChange: () => void;
}

function WordManager({ collection, onClose, onWordCountChange }: WordManagerProps) {
  const [collectionWords, setCollectionWords] = useState<Word[]>([]);
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'in' | 'add'>('in');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [showWordForm, setShowWordForm] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | undefined>(undefined);

  const inIds = new Set(collectionWords.map((w) => w.id));

  const loadCollectionWords = useCallback(() => {
    return fetchCollectionWords(collection.id).then(setCollectionWords);
  }, [collection.id]);

  const loadAllWords = useCallback((q: string) => {
    const params: Record<string, string> = { limit: '100' };
    if (q) params.search = q;
    return fetchWords(params).then((r) => setAllWords(r.words));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCollectionWords(), loadAllWords('')]).finally(() => setLoading(false));
  }, [loadCollectionWords, loadAllWords]);

  useEffect(() => {
    const t = setTimeout(() => loadAllWords(search), 250);
    return () => clearTimeout(t);
  }, [search, loadAllWords]);

  const handleAdd = async (wordId: string) => {
    setBusy(wordId);
    try {
      await addWordToCollection(collection.id, wordId);
      await loadCollectionWords();
      onWordCountChange();
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async (wordId: string) => {
    setBusy(wordId);
    try {
      await removeWordFromCollection(collection.id, wordId);
      await loadCollectionWords();
      onWordCountChange();
    } finally {
      setBusy(null);
    }
  };

  const addableWords = allWords.filter((w) => !inIds.has(w.id));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col h-[600px]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">{collection.name}</h2>
            <p className="text-xs text-gray-400">{collectionWords.length} Vokabeln in dieser Sammlung</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWordForm(true)}
              className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Neue Vokabel
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
          </div>
        </div>

        <div className="flex border-b border-gray-100 px-6">
          <button
            onClick={() => setTab('in')}
            className={`py-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors ${
              tab === 'in' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            In dieser Sammlung ({collectionWords.length})
          </button>
          {!collection.isDefault && (
            <button
              onClick={() => setTab('add')}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                tab === 'add' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Wörter hinzufügen
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-7 h-7 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">

            {tab === 'in' && (
              <>
                {collectionWords.length === 0 ? (
                  <p className="text-center text-gray-400 py-12 text-sm">
                    Keine Vokabeln in dieser Sammlung.
                    {!collection.isDefault && (
                      <button onClick={() => setTab('add')} className="block mx-auto mt-2 text-indigo-500 hover:underline">
                        Jetzt Wörter hinzufügen →
                      </button>
                    )}
                  </p>
                ) : (
                  <div className="overflow-y-auto flex-1">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50 text-xs text-gray-400 uppercase">
                        <tr>
                          <th className="text-left px-6 py-2">Kana</th>
                          <th className="text-left px-6 py-2">Kanji</th>
                          <th className="text-left px-6 py-2">Deutsch</th>
                          <th className="text-left px-6 py-2 hidden sm:table-cell">Wortart</th>
                          {!collection.isDefault && <th className="px-4 py-2" />}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {collectionWords.map((w) => (
                          <tr
                            key={w.id}
                            onClick={() => setEditingWord(w)}
                            className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-2.5 font-japanese text-gray-800">{w.hiragana}</td>
                            <td className="px-6 py-2.5 font-japanese text-gray-500">{w.kanji ?? '—'}</td>
                            <td className="px-6 py-2.5 text-gray-700">{w.deutsch}</td>
                            <td className="px-6 py-2.5 text-gray-400 hidden sm:table-cell">{w.wortart}</td>
                            {!collection.isDefault && (
                              <td className="px-4 py-2.5 text-right">
                                <button
                                  disabled={busy === w.id}
                                  onClick={(e) => { e.stopPropagation(); handleRemove(w.id); }}
                                  className="text-red-300 hover:text-red-500 disabled:opacity-40 transition-colors text-lg leading-none"
                                  title="Aus Sammlung entfernen"
                                >
                                  {busy === w.id ? '…' : '×'}
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {tab === 'add' && (
              <>
                <div className="px-6 py-3 border-b border-gray-50">
                  <input
                    autoFocus
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Suche (Kana, Kanji, Deutsch)…"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    {addableWords.length} Wörter noch nicht in dieser Sammlung
                  </p>
                </div>
                <div className="overflow-y-auto flex-1">
                  {addableWords.length === 0 ? (
                    <p className="text-center text-gray-400 py-10 text-sm">
                      {search ? 'Keine Treffer.' : 'Alle Wörter sind bereits in dieser Sammlung.'}
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50 text-xs text-gray-400 uppercase">
                        <tr>
                          <th className="text-left px-6 py-2">Kana</th>
                          <th className="text-left px-6 py-2">Kanji</th>
                          <th className="text-left px-6 py-2">Deutsch</th>
                          <th className="text-left px-6 py-2 hidden sm:table-cell">Wortart</th>
                          <th className="px-4 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {addableWords.map((w) => (
                          <tr key={w.id} className="hover:bg-indigo-50/50">
                            <td className="px-6 py-2.5 font-japanese text-gray-800">{w.hiragana}</td>
                            <td className="px-6 py-2.5 font-japanese text-gray-500">{w.kanji ?? '—'}</td>
                            <td className="px-6 py-2.5 text-gray-700">{w.deutsch}</td>
                            <td className="px-6 py-2.5 text-gray-400 hidden sm:table-cell">{w.wortart}</td>
                            <td className="px-4 py-2.5 text-right">
                              <button
                                disabled={busy === w.id}
                                onClick={() => handleAdd(w.id)}
                                className="text-indigo-300 hover:text-indigo-500 disabled:opacity-40 transition-colors text-lg leading-none"
                                title="Zur Sammlung hinzufügen"
                              >
                                {busy === w.id ? '…' : '+'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>

      <WordFormOverlay
        isOpen={showWordForm}
        collectionId={collection.isDefault ? undefined : collection.id}
        onClose={() => setShowWordForm(false)}
        onSaved={async () => {
          await loadCollectionWords();
          onWordCountChange();
        }}
      />

      <WordFormOverlay
        isOpen={!!editingWord}
        word={editingWord}
        onClose={() => setEditingWord(undefined)}
        onSaved={async () => {
          await loadCollectionWords();
          onWordCountChange();
        }}
        onDeleted={async () => {
          await loadCollectionWords();
          onWordCountChange();
        }}
      />
    </div>
  );
}

// ─── Icon helpers ────────────────────────────────────────────────────────────

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

// ─── Main Collections Page ───────────────────────────────────────────────────

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [error, setError] = useState('');
  const [managingCollection, setManagingCollection] = useState<Collection | null>(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    fetchCollections().then(setCollections).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) { setError('Name erforderlich'); return; }
    try {
      await createCollection(formName.trim(), formDesc.trim() || undefined);
      setShowCreate(false);
      setFormName(''); setFormDesc(''); setError('');
      load();
    } catch { setError('Fehler beim Erstellen'); }
  };

  const handleUpdate = async (id: string) => {
    if (!formName.trim()) { setError('Name erforderlich'); return; }
    try {
      await updateCollection(id, formName.trim(), formDesc.trim() || undefined);
      setEditId(null);
      setFormName(''); setFormDesc(''); setError('');
      load();
    } catch { setError('Fehler beim Umbenennen'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Sammlung „${name}" wirklich löschen?`)) return;
    try {
      await deleteCollection(id);
      load();
    } catch { alert('Fehler beim Löschen'); }
  };

  const startEdit = (c: Collection) => {
    setEditId(c.id);
    setFormName(c.name);
    setFormDesc(c.beschreibung ?? '');
    setError('');
  };

  const startLearn = (c: Collection) => {
    if (c.isDefault) {
      navigate('/learn');
    } else {
      navigate(`/learn?collectionId=${c.id}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sammlungen</h1>
          <p className="text-sm text-gray-500">Sammlung auswählen und lernen</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setEditId(null); setFormName(''); setFormDesc(''); setError(''); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          + Neu
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-sm space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm">Neue Sammlung</h3>
          <input
            autoFocus
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Name der Sammlung"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <input
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            placeholder="Beschreibung (optional)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Erstellen
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="text-gray-500 px-4 py-1.5 text-sm hover:text-gray-700">
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {collections.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col gap-2 min-w-0">
              {editId === c.id ? (
                <div className="space-y-2">
                  <input
                    autoFocus
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <input
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Beschreibung (optional)"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  {error && <p className="text-red-500 text-xs">{error}</p>}
                  <div className="flex gap-1">
                    <button onClick={() => handleUpdate(c.id)} className="flex-1 bg-indigo-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
                      Speichern
                    </button>
                    <button onClick={() => setEditId(null)} className="flex-1 text-gray-500 text-xs py-1.5 hover:text-gray-700">
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Title + badge */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm leading-tight break-words">{c.name}</span>
                      {c.isDefault && (
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full shrink-0">Standard</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{c._count?.words ?? 0} Vokabeln</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startLearn(c)}
                      className="flex-1 bg-indigo-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Lernen
                    </button>
                    <button
                      onClick={() => setManagingCollection(c)}
                      className="p-1.5 text-gray-400 hover:text-indigo-500 transition-colors rounded-lg hover:bg-indigo-50"
                      title="Wörter verwalten"
                    >
                      <ListIcon />
                    </button>
                    {!c.isDefault && (
                      <>
                        <button
                          onClick={() => startEdit(c)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
                          title="Umbenennen"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 text-red-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                          title="Löschen"
                        >
                          <TrashIcon />
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {managingCollection && (
        <WordManager
          collection={managingCollection}
          onClose={() => setManagingCollection(null)}
          onWordCountChange={load}
        />
      )}
    </div>
  );
}
