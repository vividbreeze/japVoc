interface BackupWord {
  id: string;
  hiragana: string;
  kanji: string | null;
  romaji: string | null;
  deutsch: string;
  beispielsatz_jp: string | null;
  beispielsatz_de: string | null;
  wortart: string;
  jlpt_level: string;
}

interface BackupCollection {
  id: string;
  name: string;
  beschreibung: string | null;
  isDefault: boolean;
}

interface BackupData {
  version: number;
  exportedAt: string;
  words: BackupWord[];
  collections: BackupCollection[];
  collectionWords: { collectionId: string; wordId: string }[];
  progress: unknown[];
}

function uuid(): string {
  return crypto.randomUUID();
}

function detectSeparator(header: string): string {
  const semicolons = (header.match(/;/g) ?? []).length;
  const commas = (header.match(/,/g) ?? []).length;
  return semicolons >= commas ? ';' : ',';
}

function parseRow(line: string, sep: string): string[] {
  // Handle simple quoted fields
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Maps normalised header strings to field names
const HEADER_MAP: Record<string, keyof Pick<BackupWord, 'hiragana' | 'romaji' | 'deutsch'> | 'kategorie'> = {
  // Hiragana / Katakana variants
  hiragana: 'hiragana',
  katakana: 'hiragana',
  hiraganakatakana: 'hiragana',
  kana: 'hiragana',
  japanisch: 'hiragana',
  japanese: 'hiragana',
  // Romaji variants
  romaji: 'romaji',
  romanisierung: 'romaji',
  aussprache: 'romaji',
  // Deutsch variants
  deutsch: 'deutsch',
  bedeutung: 'deutsch',
  german: 'deutsch',
  ubersetzung: 'deutsch',
  // Kategorie
  kategorie: 'kategorie',
  category: 'kategorie',
  sammlung: 'kategorie',
  collection: 'kategorie',
};

export function csvToBackup(csvText: string): BackupData {
  // Normalize line endings and remove BOM
  const lines = csvText.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Find first non-empty line as header
  const headerLineIdx = lines.findIndex((l) => l.trim().length > 0);
  if (headerLineIdx === -1) throw new Error('CSV ist leer');

  const sep = detectSeparator(lines[headerLineIdx]);
  const headers = parseRow(lines[headerLineIdx], sep).map(normalizeHeader);

  // Resolve column indices
  const colIdx: { hiragana: number; romaji: number; deutsch: number; kategorie: number } = {
    hiragana: -1,
    romaji: -1,
    deutsch: -1,
    kategorie: -1,
  };

  headers.forEach((h, i) => {
    const mapped = HEADER_MAP[h];
    if (mapped && colIdx[mapped] === -1) colIdx[mapped] = i;
  });

  if (colIdx.hiragana === -1) throw new Error('Spalte Hiragana / Katakana nicht gefunden');
  if (colIdx.deutsch === -1) throw new Error('Spalte Deutsch / Bedeutung nicht gefunden');

  // Build default collection
  const defaultColId = uuid();
  const categoryMap = new Map<string, string>(); // category name → id

  const words: BackupWord[] = [];
  const collectionWords: { collectionId: string; wordId: string }[] = [];

  for (let i = headerLineIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseRow(line, sep);
    const hiragana = cols[colIdx.hiragana] ?? '';
    const deutsch = cols[colIdx.deutsch] ?? '';

    if (!hiragana || !deutsch) continue;

    const romaji = colIdx.romaji >= 0 ? (cols[colIdx.romaji] || null) : null;
    const kategorie = colIdx.kategorie >= 0 ? (cols[colIdx.kategorie] || null) : null;

    const wordId = uuid();
    words.push({
      id: wordId,
      hiragana,
      kanji: null,
      romaji,
      deutsch,
      beispielsatz_jp: null,
      beispielsatz_de: null,
      wortart: 'Ausdruck',
      jlpt_level: 'N5',
    });

    // Always link to default collection
    collectionWords.push({ collectionId: defaultColId, wordId });

    // Link to category collection if present
    if (kategorie) {
      if (!categoryMap.has(kategorie)) categoryMap.set(kategorie, uuid());
      collectionWords.push({ collectionId: categoryMap.get(kategorie)!, wordId });
    }
  }

  if (words.length === 0) throw new Error('Keine Vokabeln in der CSV gefunden');

  const collections: BackupCollection[] = [
    { id: defaultColId, name: 'Gesamtwortschatz', beschreibung: null, isDefault: true },
    ...Array.from(categoryMap.entries()).map(([name, id]) => ({
      id,
      name,
      beschreibung: null,
      isDefault: false,
    })),
  ];

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    words,
    collections,
    collectionWords,
    progress: [],
  };
}
