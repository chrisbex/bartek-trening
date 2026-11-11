import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Deal } from '../types/bridge';
import { exportToPbn } from '../utils/pbnParser';
import { X, BookOpen, Plus, Trash2, Edit3, Share2, Check, Sparkles } from 'lucide-react';

interface DealsLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  deals: Deal[];
  activeDealId: string;
  onSelectDeal: (deal: Deal) => void;
  onEditDeal: (deal: Deal) => void;
  onDeleteDeal: (dealId: string) => void;
  onOpenCreator: () => void;
}

export const DealsLibraryModal: React.FC<DealsLibraryModalProps> = ({
  isOpen,
  onClose,
  deals,
  activeDealId,
  onSelectDeal,
  onEditDeal,
  onDeleteDeal,
  onOpenCreator,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Wszystkie');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ['Wszystkie', 'Rozgrywka w bez atu', 'Rozgrywka atutowa', 'Licytacja jednostronna', 'Gra w obronie', 'Licytacja zaawansowana i szlemiki', 'Własne'];

  const filteredDeals = deals.filter(deal => {
    if (selectedCategory === 'Wszystkie') return true;
    if (selectedCategory === 'Własne') return deal.isUserCreated;
    return deal.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const handleCopyPbn = (deal: Deal, e: React.MouseEvent) => {
    e.stopPropagation();
    const pbn = exportToPbn(deal);
    navigator.clipboard.writeText(pbn).then(() => {
      setCopiedId(deal.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deals-library-title"
      className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800/90 px-5 py-3.5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 id="deals-library-title" className="text-base font-bold text-white">Biblioteka rozdań i lekcji brydżowych</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreator();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Stwórz własne</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="bg-slate-900/60 px-5 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Deals Grid */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredDeals.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-400">
              Brak rozdań w wybranej kategorii. Kliknij &quot;Stwórz własne&quot;, aby dodać nowe rozdanie!
            </div>
          ) : (
            filteredDeals.map(deal => {
              const isActive = deal.id === activeDealId;

              return (
                <div
                  key={deal.id}
                  onClick={() => {
                    onSelectDeal(deal);
                    onClose();
                  }}
                  className={`
                    p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left group
                    ${isActive
                      ? 'bg-blue-950/40 border-blue-400 ring-2 ring-blue-500/40'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-500'
                    }
                  `}
                >
                  <div>
                    {/* Tags row */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/70 text-blue-200">
                          {deal.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          deal.difficulty === 'Początkujący'
                            ? 'bg-emerald-950/60 text-emerald-300'
                            : deal.difficulty === 'Średniozaawansowany'
                            ? 'bg-amber-950/60 text-amber-300'
                            : 'bg-rose-950/60 text-rose-300'
                        }`}>
                          {deal.difficulty}
                        </span>
                        {deal.isUserCreated && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-900/60 text-purple-300">
                            Własne
                          </span>
                        )}
                      </div>

                      {isActive && (
                        <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Na stole
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors mb-1">
                      {deal.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 mb-2 leading-relaxed">
                      {deal.teacherGoal || deal.description}
                    </p>
                  </div>

                  {/* Footer metadata & buttons */}
                  <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>Rozdający: <strong className="text-slate-200">{deal.dealer}</strong></span>
                      <span>•</span>
                      <span>Partia: <strong className="text-slate-200">{deal.vulnerability}</strong></span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleCopyPbn(deal, e)}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Kopiuj PBN"
                      >
                        {copiedId === deal.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>

                      {deal.isUserCreated && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                              onEditDeal(deal);
                            }}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Edytuj rozdanie"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Czy na pewno chcesz usunąć rozdanie "${deal.title}"?`)) {
                                onDeleteDeal(deal.id);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition"
                            title="Usuń rozdanie"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
