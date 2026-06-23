'use client';

import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Send, X, Layers } from 'lucide-react';
import StagePreview from './StagePreview';

interface BibleSearchProps {
  workspaceId: string;
  activeState: any;
  updateState: (newState: any) => Promise<void>;
}

// Popular books and their chapters for dropdown selection
const BIBLE_BOOKS = [
  { id: 'kejadian', name: 'Kejadian', chapters: 50 },
  { id: 'keluaran', name: 'Keluaran', chapters: 40 },
  { id: 'imamat', name: 'Imamat', chapters: 27 },
  { id: 'bilangan', name: 'Bilangan', chapters: 36 },
  { id: 'ulangan', name: 'Ulangan', chapters: 34 },
  { id: 'yosua', name: 'Yosua', chapters: 24 },
  { id: 'hakim-hakim', name: 'Hakim-hakim', chapters: 21 },
  { id: 'rut', name: 'Rut', chapters: 4 },
  { id: '1-samuel', name: '1 Samuel', chapters: 31 },
  { id: '2-samuel', name: '2 Samuel', chapters: 24 },
  { id: '1-raja-raja', name: '1 Raja-raja', chapters: 22 },
  { id: '2-raja-raja', name: '2 Raja-raja', chapters: 25 },
  { id: '1-tawarikh', name: '1 Tawarikh', chapters: 29 },
  { id: '2-tawarikh', name: '2 Tawarikh', chapters: 36 },
  { id: 'ezra', name: 'Ezra', chapters: 10 },
  { id: 'nehemia', name: 'Nehemia', chapters: 13 },
  { id: 'ester', name: 'Ester', chapters: 10 },
  { id: 'ayub', name: 'Ayub', chapters: 42 },
  { id: 'mazmur', name: 'Mazmur', chapters: 150 },
  { id: 'amsal', name: 'Amsal', chapters: 31 },
  { id: 'pengkhotbah', name: 'Pengkhotbah', chapters: 12 },
  { id: 'kidung-agung', name: 'Kidung Agung', chapters: 8 },
  { id: 'yesaya', name: 'Yesaya', chapters: 66 },
  { id: 'yeremia', name: 'Yeremia', chapters: 52 },
  { id: 'ratapan', name: 'Ratapan', chapters: 5 },
  { id: 'yehezkiel', name: 'Yehezkiel', chapters: 48 },
  { id: 'daniel', name: 'Daniel', chapters: 12 },
  { id: 'hosea', name: 'Hosea', chapters: 14 },
  { id: 'yoel', name: 'Yoel', chapters: 3 },
  { id: 'amos', name: 'Amos', chapters: 9 },
  { id: 'obaja', name: 'Obaja', chapters: 1 },
  { id: 'yunus', name: 'Yunus', chapters: 4 },
  { id: 'mikha', name: 'Mikha', chapters: 7 },
  { id: 'nahum', name: 'Nahum', chapters: 3 },
  { id: 'habakuk', name: 'Habakuk', chapters: 3 },
  { id: 'zefanya', name: 'Zefanya', chapters: 3 },
  { id: 'hagai', name: 'Hagai', chapters: 2 },
  { id: 'zakharia', name: 'Zakharia', chapters: 14 },
  { id: 'maleakhi', name: 'Maleakhi', chapters: 4 },
  { id: 'matius', name: 'Matius', chapters: 28 },
  { id: 'markus', name: 'Markus', chapters: 16 },
  { id: 'lukas', name: 'Lukas', chapters: 24 },
  { id: 'yohanes', name: 'Yohanes', chapters: 21 },
  { id: 'kisah-para-rasul', name: 'Kisah Para Rasul', chapters: 28 },
  { id: 'roma', name: 'Roma', chapters: 16 },
  { id: '1-korintus', name: '1 Korintus', chapters: 16 },
  { id: '2-korintus', name: '2 Korintus', chapters: 13 },
  { id: 'galatia', name: 'Galatia', chapters: 6 },
  { id: 'efesus', name: 'Efesus', chapters: 6 },
  { id: 'filipi', name: 'Filipi', chapters: 4 },
  { id: 'kolose', name: 'Kolose', chapters: 4 },
  { id: '1-tesalonika', name: '1 Tesalonika', chapters: 5 },
  { id: '2-tesalonika', name: '2 Tesalonika', chapters: 3 },
  { id: '1-timotius', name: '1 Timotius', chapters: 6 },
  { id: '2-timotius', name: '2 Timotius', chapters: 4 },
  { id: 'titus', name: 'Titus', chapters: 3 },
  { id: 'filemon', name: 'Filemon', chapters: 1 },
  { id: 'ibrani', name: 'Ibrani', chapters: 13 },
  { id: 'yakobus', name: 'Yakobus', chapters: 5 },
  { id: '1-petrus', name: '1 Petrus', chapters: 5 },
  { id: '2-petrus', name: '2 Petrus', chapters: 3 },
  { id: '1-yohanes', name: '1 Yohanes', chapters: 5 },
  { id: '2-yohanes', name: '2 Yohanes', chapters: 1 },
  { id: '3-yohanes', name: '3 Yohanes', chapters: 1 },
  { id: 'yudas', name: 'Yudas', chapters: 1 },
  { id: 'wahyu', name: 'Wahyu', chapters: 22 }
];

// Local database of common verses
const LOCAL_VERSES: Record<string, { ref: string; id: string; en: string }> = {
  'yohanes 3:16': {
    ref: 'Yohanes 3:16',
    id: 'Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal, supaya setiap orang yang percaya kepada-Nya tidak binasa, melainkan beroleh hidup yang kekal.',
    en: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.'
  },
  'kejadian 1:1': {
    ref: 'Kejadian 1:1',
    id: 'Pada mulanya Allah menciptakan langit dan bumi.',
    en: 'In the beginning, God created the heavens and the earth.'
  },
  'mazmur 23:1': {
    ref: 'Mazmur 23:1',
    id: 'Tuhan adalah gembalaku, takkan kekurangan aku.',
    en: 'The Lord is my shepherd; I shall not want.'
  },
  'matius 6:33': {
    ref: 'Matius 6:33',
    id: 'Tetapi carilah dahulu Kerajaan Allah dan kebenarannya, maka semuanya itu akan ditambahkan kepadamu.',
    en: 'But seek first the kingdom of God and his righteousness, and all these things will be added to you.'
  }
};

const BIBLE_BOOKS_ENG_MAP: Record<string, string> = {
  'kejadian': 'genesis',
  'keluaran': 'exodus',
  'imamat': 'leviticus',
  'bilangan': 'numbers',
  'ulangan': 'deuteronomy',
  'yosua': 'joshua',
  'hakim-hakim': 'judges',
  'rut': 'ruth',
  '1-samuel': '1 samuel',
  '2-samuel': '2 samuel',
  '1-raja-raja': '1 kings',
  '2-raja-raja': '2 kings',
  '1-tawarikh': '1 chronicles',
  '2-tawarikh': '2 chronicles',
  'ezra': 'ezra',
  'nehemia': 'nehemiah',
  'ester': 'esther',
  'ayub': 'job',
  'mazmur': 'psalms',
  'amsal': 'proverbs',
  'pengkhotbah': 'ecclesiastes',
  'kidung-agung': 'song of solomon',
  'yesaya': 'isaiah',
  'yeremia': 'jeremiah',
  'ratapan': 'lamentations',
  'yehezkiel': 'ezekiel',
  'daniel': 'daniel',
  'hosea': 'hosea',
  'yoel': 'joel',
  'amos': 'amos',
  'obaja': 'obadiah',
  'yunus': 'jonah',
  'mikha': 'micah',
  'nahum': 'nahum',
  'habakuk': 'habakkuk',
  'zefanya': 'zephaniah',
  'hagai': 'haggai',
  'zakharia': 'zechariah',
  'maleakhi': 'malachi',
  'matius': 'matthew',
  'markus': 'mark',
  'lukas': 'luke',
  'yohanes': 'john',
  'kisah-para-rasul': 'acts',
  'roma': 'romans',
  '1-korintus': '1 corinthians',
  '2-korintus': '2 corinthians',
  'galatia': 'galatians',
  'efesus': 'ephesians',
  'filipi': 'philippians',
  'kolose': 'colossians',
  '1-tesalonika': '1 thessalonians',
  '2-tesalonika': '2 thessalonians',
  '1-timotius': '1 timothy',
  '2-timotius': '2 timothy',
  'titus': 'titus',
  'filemon': 'philemon',
  'ibrani': 'hebrews',
  'yakobus': 'james',
  '1-petrus': '1 peter',
  '2-petrus': '2 peter',
  '1-yohanes': '1 john',
  '2-yohanes': '2 john',
  '3-yohanes': '3 john',
  'yudas': 'jude',
  'wahyu': 'revelation'
};

// Helper to estimate maximum verses in a chapter to limit the dropdown
const getMaxVerses = (bookId: string, chapter: number): number => {
  if (bookId === 'mazmur') {
    if (chapter === 119) return 176;
    if (chapter === 78) return 72;
    if (chapter === 89) return 52;
    if (chapter === 105) return 45;
    if (chapter === 106) return 48;
    if (chapter === 107) return 43;
    if (chapter === 118) return 29;
    if (chapter === 135) return 21;
    if (chapter === 136) return 26;
    return 40; // Default max for other Psalms
  }
  return 80; // Default max for other books/chapters
};

export default function BibleSearch({ workspaceId, activeState, updateState }: BibleSearchProps) {
  // Select state
  const [selectedBook, setSelectedBook] = useState('yohanes');
  const [selectedChapter, setSelectedChapter] = useState(3);
  const [selectedVerse, setSelectedVerse] = useState(16);

  // Languages configurations
  const [displayMode, setDisplayMode] = useState<'id' | 'en' | 'both'>('id');
  const [translationId, setTranslationId] = useState('TB');
  const [translationEn, setTranslationEn] = useState('NIV');
  const [selectedTemplate, setSelectedTemplate] = useState('Classic Box');

  useEffect(() => {
    if (activeState?.bible_verse?.template) {
      setSelectedTemplate(activeState.bible_verse.template);
    }
  }, [activeState]);

  // Text values
  const [textId, setTextId] = useState(LOCAL_VERSES['yohanes 3:16'].id);
  const [textEn, setTextEn] = useState(LOCAL_VERSES['yohanes 3:16'].en);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verseConfig = activeState?.verse_config || { x: 0, y: 0, scale: 1.0 };

  const handleConfigChange = async (key: string, val: number) => {
    await updateState({
      verse_config: {
        ...verseConfig,
        [key]: val
      }
    });
  };

  // Get active book metadata
  const currentBookMeta = BIBLE_BOOKS.find(b => b.id === selectedBook) || BIBLE_BOOKS[0];

  // Update chapters list and reset selected values when book changes
  useEffect(() => {
    setSelectedChapter(1);
    setSelectedVerse(1);
  }, [selectedBook]);

  // Reset selected verse if it exceeds max verses of the new chapter
  useEffect(() => {
    const max = getMaxVerses(selectedBook, selectedChapter);
    if (selectedVerse > max) {
      setSelectedVerse(1);
    }
  }, [selectedBook, selectedChapter, selectedVerse]);

  // Load verse from database/API when selections change
  const loadSelectedVerse = async (signal?: AbortSignal) => {
    // Validate if selection is in-bounds for the current book (prevents race condition mismatch on book change)
    if (selectedChapter > currentBookMeta.chapters) {
      return;
    }
    const maxVerses = getMaxVerses(selectedBook, selectedChapter);
    if (selectedVerse > maxVerses) {
      return;
    }

    setError(null);
    setLoading(true);

    const bookName = currentBookMeta.name;
    const cleanLookupKey = `${bookName.toLowerCase()} ${selectedChapter}:${selectedVerse}`;

    // 1. Check local database
    if (LOCAL_VERSES[cleanLookupKey]) {
      const match = LOCAL_VERSES[cleanLookupKey];
      if (signal?.aborted) return;
      setTextId(match.id);
      setTextEn(match.en);
      setLoading(false);
      return;
    }

    // 2. Fetch from free public API
    try {
      // Map Indonesian book names to English equivalent for public API
      const englishBookName = BIBLE_BOOKS_ENG_MAP[selectedBook] || selectedBook;
      const searchRef = `${englishBookName} ${selectedChapter}:${selectedVerse}`;

      const res = await fetch(`https://bible-api.com/${encodeURIComponent(searchRef)}`, { signal });
      if (res.ok) {
        const data = await res.json();
        if (signal?.aborted) return;
        const apiText = data.text.trim();
        setTextEn(apiText);
        // Translate mock or show same text if translation fails
        setTextId(apiText + ' (Terjemahan otomatis/kosong - silakan edit manual)');
      } else {
        if (signal?.aborted) return;
        setError('Ayat tidak ditemukan di server API.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || signal?.aborted) return;
      setError('Gagal memuat dari API. Silakan isi teks secara manual di bawah.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  // Trigger load when selection finishes
  useEffect(() => {
    const controller = new AbortController();
    const handler = setTimeout(() => {
      loadSelectedVerse(controller.signal);
    }, 250);

    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [selectedBook, selectedChapter, selectedVerse]);

  const handleSendToOBS = async () => {
    const bookName = currentBookMeta.name;
    const reference = `${bookName} ${selectedChapter}:${selectedVerse}`;
    
    await updateState({
      overlay_type: 'verse',
      is_cleared: false,
      bible_verse: {
        reference,
        text_id: textId,
        text_en: textEn,
        display_mode: displayMode,
        template: selectedTemplate
      }
    });
  };

  const handleClearScreen = async () => {
    await updateState({ is_cleared: true });
  };

  return (
    <div className="bible-search">
      <style jsx>{`
        .bible-search {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
          background-color: var(--bg-2);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-card);
          padding: var(--space-lg);
          box-shadow: var(--shadow-1);
        }

        .selectors-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: var(--space-md);
        }

        .select-field {
          height: 40px;
          background-color: var(--bg-2);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-input);
          padding: 0 var(--space-md);
          color: var(--t1);
          font-family: inherit;
          cursor: pointer;
          width: 100%;
        }

        .select-field:focus {
          border-color: var(--accent-border);
          outline: 2px solid var(--accent-glow);
        }

        .preview-wrapper {
          background-color: var(--bg-1);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-card);
          padding: var(--space-md);
          margin-top: var(--space-md);
        }

        .actions-row {
          display: flex;
          gap: var(--space-md);
          margin-top: var(--space-md);
        }

        .radio-options-row {
          display: flex;
          gap: var(--space-lg);
          margin: var(--space-xs) 0 var(--space-sm) 0;
        }

        .radio-label {
          display: inline-flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: 12px;
          color: var(--t2);
          cursor: pointer;
        }

        .radio-label input {
          accent-color: var(--accent);
        }

        .bible-status-tip {
          font-size: 11px;
          color: var(--t3);
          margin-top: var(--space-xs);
        }

        .range-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--bg-4);
          outline: none;
          cursor: pointer;
        }
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        .range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .visual-template-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-md);
          width: 100%;
        }

        .template-option-card {
          border: 1px solid var(--bg-4);
          border-radius: 8px;
          padding: 8px;
          background-color: var(--bg-1);
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .template-option-card:hover {
          border-color: var(--accent-border);
          background-color: var(--bg-3);
        }

        .template-option-card.active {
          border-color: var(--accent);
          background-color: var(--accent-bg);
          box-shadow: 0 0 10px var(--accent-glow);
        }

        .template-option-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--t2);
          text-align: center;
        }

        .template-option-card.active .template-option-label {
          color: var(--t1);
          font-weight: 600;
        }

        /* Mini Bible Previews */
        .mini-preview-container {
          width: 100%;
          height: 48px;
          background-color: #080a10;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .mini-bible-classic {
          width: 60%;
          height: 24px;
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 3px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
          padding: 3px 6px;
        }

        .mini-bible-ref {
          width: 30%;
          height: 2px;
          background: var(--accent);
          border-radius: 0.5px;
        }

        .mini-bible-text {
          width: 85%;
          height: 2px;
          background: #ffffff;
          border-radius: 0.5px;
        }
        
        .mini-bible-text-2 {
          width: 65%;
          height: 2px;
          background: #ffffff;
          border-radius: 0.5px;
        }

        .mini-bible-blue {
          width: 90%;
          display: flex;
          flex-direction: column;
          align-self: flex-end;
          margin-bottom: 2px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }

        .mini-blue-top {
          height: 4px;
          background: #0d47a1;
        }

        .mini-blue-body {
          height: 12px;
          background: #002171;
          display: flex;
          align-items: center;
          padding: 0 4px;
          gap: 4px;
        }

        .mini-book-shape {
          width: 8px;
          height: 6px;
          background: #ffffff;
          border-radius: 1px;
          flex-shrink: 0;
        }

        .mini-blue-text {
          width: 70%;
          height: 2px;
          background: #ffffff;
          border-radius: 0.5px;
        }

        .mini-bible-charcoal {
          width: 90%;
          height: 16px;
          background-color: rgba(18, 18, 18, 0.95);
          background-image: 
            linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .03) 25%, rgba(255, 255, 255, .03) 26%, transparent 27%, transparent), 
            linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .03) 25%, rgba(255, 255, 255, .03) 26%, transparent 27%, transparent);
          background-size: 4px 4px;
          align-self: flex-end;
          margin-bottom: 2px;
          border-radius: 2px;
          border: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          padding: 0 4px;
          gap: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }

        .mini-charcoal-content {
          display: flex;
          flex-direction: column;
          gap: 1.5px;
          flex-grow: 1;
        }
      `}</style>

      <div className="section-label">Modul Ayat Alkitab</div>

      {/* Select Dropdowns */}
      <div className="selectors-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label className="login-form-label" style={{ fontSize: '10px' }}>Kitab</label>
          <select 
            className="select-field" 
            value={selectedBook} 
            onChange={(e) => setSelectedBook(e.target.value)}
          >
            {BIBLE_BOOKS.map((book) => (
              <option key={book.id} value={book.id}>
                {book.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label className="login-form-label" style={{ fontSize: '10px' }}>Pasal</label>
          <select 
            className="select-field" 
            value={selectedChapter} 
            onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
          >
            {Array.from({ length: currentBookMeta.chapters }, (_, i) => i + 1).map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label className="login-form-label" style={{ fontSize: '10px' }}>Ayat</label>
          <select 
            className="select-field" 
            value={selectedVerse} 
            onChange={(e) => setSelectedVerse(parseInt(e.target.value))}
          >
            {/* Render up to max verses estimated for selection */}
            {Array.from({ length: getMaxVerses(selectedBook, selectedChapter) }, (_, i) => i + 1).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Language Selection Toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'var(--space-xs)' }}>
        <label className="login-form-label" style={{ fontSize: '10px' }}>Mode Bahasa Tampilan (Jemaat OBS)</label>
        <div className="radio-options-row">
          <label className="radio-label">
            <input 
              type="radio" 
              name="langMode" 
              checked={displayMode === 'id'} 
              onChange={() => setDisplayMode('id')} 
            />
            <span>Hanya Indonesia (TB)</span>
          </label>
          <label className="radio-label">
            <input 
              type="radio" 
              name="langMode" 
              checked={displayMode === 'en'} 
              onChange={() => setDisplayMode('en')} 
            />
            <span>Hanya English (NIV/WEB)</span>
          </label>
          <label className="radio-label">
            <input 
              type="radio" 
              name="langMode" 
              checked={displayMode === 'both'} 
              onChange={() => setDisplayMode('both')} 
            />
            <span>Dual Bahasa (ID + EN)</span>
          </label>
        </div>
      </div>

      {/* Template Selection Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
        <label className="login-form-label" style={{ fontSize: '11px', fontWeight: 600 }}>Template Visual Alkitab (Klik untuk Memilih)</label>
        <div className="visual-template-grid">
          {[
            { id: 'Classic Box', label: 'Classic Box', render: () => (
              <div className="mini-bible-classic">
                <div className="mini-bible-ref"></div>
                <div className="mini-bible-text"></div>
                <div className="mini-bible-text-2"></div>
              </div>
            )},
            { id: 'Blue Banner', label: 'Blue Banner', render: () => (
              <div className="mini-bible-blue">
                <div className="mini-blue-top"></div>
                <div className="mini-blue-body">
                  <div className="mini-book-shape"></div>
                  <div className="mini-blue-text"></div>
                </div>
              </div>
            )},
            { id: 'Charcoal Grid', label: 'Charcoal Grid', render: () => (
              <div className="mini-bible-charcoal">
                <div className="mini-book-shape"></div>
                <div className="mini-charcoal-content">
                  <div className="mini-bible-text"></div>
                  <div className="mini-bible-ref"></div>
                </div>
              </div>
            )}
          ].map((opt) => {
            const isActive = selectedTemplate === opt.id;
            return (
              <div 
                key={opt.id} 
                className={`template-option-card ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedTemplate(opt.id)}
              >
                <div className="mini-preview-container">
                  {opt.render()}
                </div>
                <span className="template-option-label">{opt.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="badge-live" style={{ backgroundColor: 'var(--live-bg)', color: 'var(--live)', border: 'none', padding: '6px 12px', borderRadius: '6px' }}>
          {error}
        </div>
      )}

      {/* Embed Stage Preview */}
      <div>
        <div className="section-label" style={{ marginBottom: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Stage Preview (Alkitab)</span>
          <span style={{ color: 'var(--accent)', fontSize: '10px', fontWeight: 'bold' }}>PREVIEW EDIT</span>
        </div>
        <StagePreview state={{ ...activeState, overlay_type: 'verse', bible_verse: { reference: `${currentBookMeta.name} ${selectedChapter}:${selectedVerse}`, text_id: textId, text_en: textEn, display_mode: displayMode, template: selectedTemplate } }} />
      </div>

      {/* Verse text content editing */}
      <div className="preview-wrapper">
        <div className="section-label" style={{ color: 'var(--t2)' }}>Sesuaikan Isi Ayat sebelum dikirim ke OBS</div>
        
        {(displayMode === 'id' || displayMode === 'both') && (
          <div className="login-form-group" style={{ marginTop: 'var(--space-sm)' }}>
            <label className="login-form-label" style={{ fontSize: '10px' }}>Indonesia (ID)</label>
            <textarea
              className="input-field"
              style={{ height: '70px', padding: '10px', resize: 'none' }}
              value={textId}
              onChange={(e) => setTextId(e.target.value)}
            />
          </div>
        )}

        {(displayMode === 'en' || displayMode === 'both') && (
          <div className="login-form-group" style={{ marginTop: 'var(--space-sm)' }}>
            <label className="login-form-label" style={{ fontSize: '10px' }}>English (EN)</label>
            <textarea
              className="input-field"
              style={{ height: '70px', padding: '10px', resize: 'none' }}
              value={textEn}
              onChange={(e) => setTextEn(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="actions-row">
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSendToOBS} disabled={loading}>
          <Send size={16} />
          <span>Kirim ke OBS jemaat</span>
        </button>
        <button className="btn btn-clear" style={{ flex: 0.5 }} onClick={handleClearScreen}>
          <X size={16} />
          <span>[CLEAR SCREEN ✕]</span>
        </button>
      </div>

      {/* Position & Scale Sliders */}
      <div className="layout-settings-card" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md) 0 0 0', borderTop: '1px solid var(--bg-4)' }}>
        <div className="section-label" style={{ marginBottom: 'var(--space-sm)', color: 'var(--t2)' }}>Tata Letak & Skala Ayat Alkitab</div>
        <div className="slider-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
          <div className="slider-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="login-form-label" style={{ fontSize: '10px', color: 'var(--t2)', marginBottom: 0 }}>Geser X: {verseConfig.x}px</span>
              <button onClick={() => handleConfigChange('x', 0)} title="Reset ke 0" style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '10px' }}>↺ Reset</button>
            </div>
            <input 
              type="range" 
              min="-500" 
              max="500" 
              className="range-slider" 
              value={verseConfig.x} 
              onChange={(e) => handleConfigChange('x', parseInt(e.target.value))} 
            />
          </div>
          <div className="slider-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="login-form-label" style={{ fontSize: '10px', color: 'var(--t2)', marginBottom: 0 }}>Geser Y: {verseConfig.y}px</span>
              <button onClick={() => handleConfigChange('y', 0)} title="Reset ke 0" style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '10px' }}>↺ Reset</button>
            </div>
            <input 
              type="range" 
              min="-500" 
              max="500" 
              className="range-slider" 
              value={verseConfig.y} 
              onChange={(e) => handleConfigChange('y', parseInt(e.target.value))} 
            />
          </div>
          <div className="slider-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="login-form-label" style={{ fontSize: '10px', color: 'var(--t2)', marginBottom: 0 }}>Skala: {verseConfig.scale.toFixed(1)}x</span>
              <button onClick={() => handleConfigChange('scale', 1.0)} title="Reset ke 1.0" style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '10px' }}>↺ Reset</button>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="2.0" 
              step="0.1"
              className="range-slider" 
              value={verseConfig.scale} 
              onChange={(e) => handleConfigChange('scale', parseFloat(e.target.value))} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
