import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { fetchStats } from '../api/client';
import type { Stats } from '../types';

const DISTRIBUTION_COLORS: Record<string, string> = {
  Neu: '#e5e7eb',
  'In Übung': '#fbbf24',
  Bekannt: '#34d399',
  Meister: '#60a5fa',
};

export default function Statistics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return <p className="text-red-500">Fehler beim Laden.</p>;

  const distributionData = [
    { name: 'Neu', value: stats.distribution.new },
    { name: 'In Übung', value: stats.distribution.learning },
    { name: 'Bekannt', value: stats.distribution.review },
    { name: 'Meister', value: stats.distribution.master },
  ].filter((d) => d.value > 0);

  const barData = stats.dailyHistory.map((d) => ({
    date: new Date(d.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    Karten: d.cardsStudied,
  }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Statistiken</h1>
        <p className="text-sm text-gray-500">Dein Lernverlauf der letzten 30 Tage</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Gesamt', value: stats.totalWords, color: 'text-gray-700' },
          { label: 'Gelernt', value: stats.learnedCount, color: 'text-green-600' },
          { label: 'Streak', value: `${stats.streak} 🔥`, color: 'text-orange-500' },
          { label: 'Fortschritt', value: `${stats.percentageLearned}%`, color: 'text-indigo-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Gelernte Karten pro Tag</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              cursor={{ fill: '#f3f4f6' }}
            />
            <Bar dataKey="Karten" radius={[4, 4, 0, 0]}>
              {barData.map((entry, index) => (
                <Cell key={index} fill={entry.Karten > 0 ? '#6366f1' : '#e5e7eb'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart */}
      {distributionData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Verteilung nach Status</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {distributionData.map((entry) => (
                    <Cell key={entry.name} fill={DISTRIBUTION_COLORS[entry.name]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {distributionData.map(({ name, value }) => (
                <div key={name} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: DISTRIBUTION_COLORS[name] }}
                  />
                  <span className="text-sm text-gray-600">{name}</span>
                  <span className="ml-auto font-semibold text-sm text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
