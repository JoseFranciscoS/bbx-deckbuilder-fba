import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import QRShare from './components/QRShare';
import * as piecesData from './data/pieces.json';
import './App.css';

/* ===== Opciones BBX desde JSON ===== */
const { LOCK_CHIPS, ASSIST_BLADES, BLADES, RATCHETS, BITS } = piecesData as any;

/* ===== Types ===== */
type Combo = {
  lockChip: string;
  assistBlade: string;
  blade: string;
  ratchet: string;
  bit: string;
};

type SavedDeck = {
  blader: string;
  date: string;
  combos: Combo[];
  tournament: string;
  comboCount: 1 | 3 | 5;
};

const emptyCombo: Combo = {
  lockChip: '',
  assistBlade: '',
  blade: '',
  ratchet: '',
  bit: '',
};

function App() {
  /* ===== Theme ===== */
  const [darkMode, setDarkMode] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem('bbx-theme');
    if (saved) setDarkMode(saved === 'dark');
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      darkMode ? 'dark' : 'light'
    );
    localStorage.setItem('bbx-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  /* ===== App State ===== */
  const [blader, setBlader] = useState('');
  const [tournament, setTournament] = useState('');
  const [comboCount, setComboCount] = useState<1 | 3 | 5>(1);
  const [combos, setCombos] = useState<Combo[]>([{ ...emptyCombo }]);
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [allowRepeats, setAllowRepeats] = useState(false);
  const [canClear, setCanClear] = useState(false);

  const today = new Date().toLocaleDateString('es-CL');

  /* ===== Manejo de combos ===== */
  const handleComboCountChange = (count: 1 | 3 | 5) => {
    setComboCount(count);
    setCombos((prev) => {
      const next = [...prev];
      while (next.length < count) next.push({ ...emptyCombo });
      next.length = count;
      return next;
    });
  };

  const updateCombo = (index: number, field: keyof Combo, value: string) => {
    setCombos((prev) =>
      prev.map((combo, i) =>
        i === index ? { ...combo, [field]: value } : combo
      )
    );
  };

  /* ===== Restricción de piezas ===== */
  const getUsedValues = (field: keyof Combo, currentIndex: number): string[] =>
    combos
      .filter((_, i) => i !== currentIndex)
      .map((c) => c[field])
      .filter(Boolean);

  const filterOptions = (
    options: string[],
    field: keyof Combo,
    currentIndex: number
  ) => {
    if (allowRepeats) return options;
    const used = getUsedValues(field, currentIndex);
    return options.filter((opt) => opt === '' || !used.includes(opt));
  };

  /* ===== Validaciones obligatorias ===== */
  const isBitDisabled = (combo: Combo) =>
    combo.ratchet === 'Operate - OP' || combo.ratchet === 'Turbo - Tr';

  const isComboValid = (combo: Combo) =>
    !!combo.blade && !!combo.ratchet && (isBitDisabled(combo) || !!combo.bit);

  const canShowQR =
    blader.trim() !== '' &&
    tournament.trim() !== '' &&
    combos.every((c) => isComboValid(c));

  /* ===== Texto QR ===== */
  const qrText = [
    'BBX-DECK',
    '',
    `Torneo: ${tournament}`,
    `Blader: ${blader}`,
    `Fecha: ${today}`,
    '',
    ...combos.map((c, i) => {
      const parts = [
        c.lockChip,
        c.assistBlade,
        c.blade,
        c.ratchet,
        c.bit,
      ].filter(Boolean);
      return `Combo ${i + 1}: ${parts.join(' | ')}`;
    }),
  ].join('\n');

  /* ===== Guardar mazo ===== */
  const saveDeck = () => {
    if (!tournament.trim()) return alert('Ingrese el nombre del torneo.');
    const deck: SavedDeck = {
      blader,
      date: today,
      combos,
      tournament,
      comboCount,
    };
    setSavedDecks((prev) => [...prev, deck]);

    const storageKey = `bbx-decks-${tournament}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    localStorage.setItem(storageKey, JSON.stringify([...existing, deck]));

    setCanClear(true);
  };

  /* ===== Limpiar inputs ===== */
  const clearInputs = () => {
    setBlader('');
    setCombos(Array.from({ length: comboCount }, () => ({ ...emptyCombo })));
    setCanClear(false);
  };

  /* ===== Exportar Excel ===== */
  const exportExcel = () => {
    if (savedDecks.length === 0) return;

    const rows = savedDecks.map((deck, deckIndex) => {
      const row: any = {
        Torneo: deck.tournament,
        Blader: deck.blader,
        Fecha: deck.date,
        Mazo: deckIndex + 1,
      };
      deck.combos.forEach((combo, comboIndex) => {
        const n = comboIndex + 1;
        row[`C${n} Lock Chip`] = combo.lockChip || '';
        row[`C${n} Assist Blade`] = combo.assistBlade || '';
        row[`C${n} Blade`] = combo.blade || '';
        row[`C${n} Ratchet`] = combo.ratchet || '';
        row[`C${n} Bit`] = combo.bit || '';
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mazos BBX');
    XLSX.writeFile(workbook, 'bbx-mazos.xlsx');
  };

  const exportHistory = () => {
    const allKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith('bbx-decks-')
    );
    let allDecks: SavedDeck[] = [];
    allKeys.forEach((key) => {
      const decks: SavedDeck[] = JSON.parse(localStorage.getItem(key) || '[]');
      allDecks = [...allDecks, ...decks];
    });

    if (allDecks.length === 0)
      return alert('No hay mazos guardados en historial.');

    const rows = allDecks.map((deck, deckIndex) => {
      const row: any = {
        Torneo: deck.tournament,
        Blader: deck.blader,
        Fecha: deck.date,
        Mazo: deckIndex + 1,
      };
      deck.combos.forEach((combo, comboIndex) => {
        const n = comboIndex + 1;
        row[`C${n} Lock Chip`] = combo.lockChip || '';
        row[`C${n} Assist Blade`] = combo.assistBlade || '';
        row[`C${n} Blade`] = combo.blade || '';
        row[`C${n} Ratchet`] = combo.ratchet || '';
        row[`C${n} Bit`] = combo.bit || '';
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial BBX');
    XLSX.writeFile(workbook, 'bbx-historial.xlsx');
  };

  /* ===== UI ===== */
  return (
    <div className="app">
      <header className="header">
        <h1>BBX Deck Builder</h1>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>

      <div className="container">
        {/* Configuración */}
        <div className="section">
          <h2>Configuración</h2>
          <div className="form">
            <input
              placeholder="Nombre Torneo *"
              value={tournament}
              onChange={(e) => setTournament(e.target.value)}
              className={tournament.trim() === '' ? 'error' : ''}
              list="torneos"
            />
            <datalist id="torneos">
              {Object.keys(localStorage)
                .filter((k) => k.startsWith('bbx-decks-'))
                .map((key) => (
                  <option key={key} value={key.replace('bbx-decks-', '')} />
                ))}
            </datalist>

            <input
              placeholder="Blader *"
              value={blader}
              onChange={(e) => setBlader(e.target.value)}
              className={blader.trim() === '' ? 'error' : ''}
            />

            <select
              value={comboCount}
              onChange={(e) =>
                handleComboCountChange(Number(e.target.value) as 1 | 3 | 5)
              }
            >
              <option value={1}>1 Combo</option>
              <option value={3}>3 Combos</option>
              <option value={5}>5 Combos</option>
            </select>

            <div className="form toggle-row">
              <span>Permitir repetir piezas</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={allowRepeats}
                  onChange={(e) => setAllowRepeats(e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>
          </div>
        </div>

        {/* Combos */}
        <div className="section">
          <h2>Combos</h2>
          {combos.map((combo, index) => {
            const bitDisabled = isBitDisabled(combo);
            const showBitError = !bitDisabled && combo.bit === '';
            const showBladeError = combo.blade === '';
            const showRatchetError = combo.ratchet === '';

            return (
              <div key={index} className="combo-card">
                <h3>Combo {index + 1}</h3>
                <div className="form">
                  <select
                    value={combo.lockChip}
                    onChange={(e) =>
                      updateCombo(index, 'lockChip', e.target.value)
                    }
                  >
                    <option value="">Lock Chip</option>
                    {filterOptions(LOCK_CHIPS, 'lockChip', index).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={combo.assistBlade}
                    onChange={(e) =>
                      updateCombo(index, 'assistBlade', e.target.value)
                    }
                  >
                    <option value="">Assist Blade</option>
                    {filterOptions(ASSIST_BLADES, 'assistBlade', index).map(
                      (a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    value={combo.blade}
                    onChange={(e) =>
                      updateCombo(index, 'blade', e.target.value)
                    }
                    className={showBladeError ? 'error' : ''}
                  >
                    <option value="">Blade *</option>
                    {filterOptions(BLADES, 'blade', index).map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>

                  <select
                    value={combo.ratchet}
                    onChange={(e) =>
                      updateCombo(index, 'ratchet', e.target.value)
                    }
                    className={showRatchetError ? 'error' : ''}
                  >
                    <option value="">Ratchet *</option>
                    {filterOptions(RATCHETS, 'ratchet', index).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  <select
                    value={combo.bit}
                    onChange={(e) => updateCombo(index, 'bit', e.target.value)}
                    className={showBitError ? 'error' : ''}
                    disabled={bitDisabled}
                  >
                    <option value="">Bit {bitDisabled ? '' : '*'}</option>
                    {filterOptions(BITS, 'bit', index).map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {/* QR */}
        {canShowQR && (
          <div className="section qr-container">
            <QRShare value={qrText} blader={blader} date={today} />
          </div>
        )}

        {/* Acciones */}
        <div className="actions">
          <button onClick={saveDeck} disabled={!canShowQR}>
            Guardar mazo
          </button>
          <button onClick={clearInputs} disabled={!canClear}>
            Limpiar
          </button>
          <button onClick={exportExcel} disabled={savedDecks.length === 0}>
            Exportar Excel
          </button>
          <button onClick={exportHistory}>Exportar Historial</button>
        </div>
      </div>
    </div>
  );
}

export default App;
