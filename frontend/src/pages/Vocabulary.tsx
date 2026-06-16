import { useEffect, useState, useCallback } from 'react';
import { fetchWords, fetchWortarten } from '../api/client';
import WordFormOverlay from '../components/WordFormOverlay';
import type { Word } from '../types';
import { getWordStatus } from '../types';

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-gray-100 text-gray-500',
  learning: 'bg-yellow-100 text-yellow-700',
  review: 'bg-green-100 text-green-700',
  master: 'bg-blue-100 text-blue-700',
};

const STATUS_LABEL: Record<string, string> = {
  new: 'Neu',
  learning: 'Üben',
  review: 'Bekannt',
  master: 'Meister',
};

export default function Vocabulary() {
  const [words, setWords] = useState<Word[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [wortart, setWortart] = useState('');
  const [wortarten, setWortarten] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [activeWord, setActiveWord] = useState<Word | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);
  const LIMIT = 50;

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
    if (search) params.search = search;
    if (wortart) params.wortart = wortart;
    fetchWords(params)
      .then((r) => { setWords(r.words); setTotal(r.total); })
      .finally(() => setLoading(false));
  }, [search, wortart, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchWortarten().then(setWortarten); }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const dueDate = (progress?: Word['progress']) => {
    if (!progress || progress.repetitions === 0) return null;
    const d = new Date(progress.nextReviewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isDue = d <= today;
    return { date: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }), isDue };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vokabeln</h1>
          <p className="text-sm text-gray-500">{total} Einträge</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          + Neu
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Suche (Hiragana, Kanji, Deutsch)…"
          value={search}
          onChange={handleSearch}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={wortart}
          onChange={(e) => { setWortart(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          <option value="">Alle Wortarten</option>
          {wortarten.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : words.length === 0 ? (
          <p className="text-center py-12 text-gray-400">Keine Vokabeln gefunden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Kana</th>
                  <th className="text-left px-4 py-3">Kanji</th>
                  <th className="text-left px-4 py-3">Deutsch</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Wortart</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Nächste WH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {words.map((w) => {
                  const status = getWordStatus(w.progress);
                  const due = dueDate(w.progress);
                  return (
                    <tr
                      key={w.id}
                      onClick={() => setActiveWord(w)}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-japanese text-base text-gray-800">{w.hiragana}</td>
                      <td className="px-4 py-3 font-japanese text-gray-600">{w.kanji ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{w.deutsch}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{w.wortart}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {due ? (
                          <span className={due.isDue ? 'text-green-600 font-medium' : 'text-gray-400'}>
                            {due.isDue ? '● heute' : due.date}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Zurück
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">
            Seite {page} / {Math.ceil(total / LIMIT)}
          </span>
          <button
            disabled={page >= Math.ceil(total / LIMIT)}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Weiter →
          </button>
        </div>
      )}

      <WordFormOverlay
        isOpen={showCreate || !!activeWord}
        word={activeWord}
        onClose={() => { setShowCreate(false); setActiveWord(undefined); }}
        onSaved={load}
        onDeleted={load}
      />
    </div>
  );
}
