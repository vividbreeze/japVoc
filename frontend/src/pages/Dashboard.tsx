import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStats } from '../api/client';
import type { Stats } from '../types';
import ProgressRing from '../components/ProgressRing';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return <p className="text-red-500">Fehler beim Laden der Statistiken.</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Dein Lernfortschritt auf einen Blick</p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          label="Heute fällig"
          value={stats.dueToday}
          sub="Wiederholungen"
          color="bg-red-50 text-red-700 border-red-100"
        />
        <StatCard
          label="Lernstreak"
          value={`${stats.streak} 🔥`}
          sub="Tage in Folge"
          color="bg-orange-50 text-orange-700 border-orange-100"
        />
        <StatCard
          label="Gelernt"
          value={stats.learnedCount}
          sub={`von ${stats.totalWords} Wörtern`}
          color="bg-green-50 text-green-700 border-green-100"
        />
      </div>

      {/* Progress ring + jetzt lernen */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <ProgressRing percentage={stats.percentageLearned} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-indigo-700">{stats.percentageLearned}%</span>
            <span className="text-xs text-gray-400">erlernt</span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-gray-700">
            Du hast <strong>{stats.learnedCount}</strong> von <strong>{stats.totalWords}</strong> N5-Vokabeln mindestens einmal gelernt.
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { label: 'Neu', value: stats.distribution.new, color: 'text-gray-500' },
              { label: 'In Übung', value: stats.distribution.learning, color: 'text-yellow-600' },
              { label: 'Bekannt', value: stats.distribution.review, color: 'text-green-600' },
              { label: 'Meister', value: stats.distribution.master, color: 'text-blue-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className={`font-semibold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/learn')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
          >
            Jetzt lernen {stats.dueToday > 0 && `(${stats.dueToday} fällig)`}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-60 mt-0.5">{sub}</p>
    </div>
  );
}
