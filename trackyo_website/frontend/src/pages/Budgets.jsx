import React, { useState, useEffect } from 'react';
import api from '../services/api';
import GlassCard from '../components/GlassCard';
import { Wallet, Sparkles, Check, Sliders, AlertCircle, TrendingDown, DollarSign, X } from 'lucide-react';

const Budgets = ({ showToast, refreshTrigger }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7); // YYYY-MM
  });

  // Budget Particulars
  const [monthlyLimit, setMonthlyLimit] = useState(15000);
  const [categoryLimits, setCategoryLimits] = useState({
    Food: 0,
    Travel: 0,
    Shopping: 0,
    Bills: 0,
    Health: 0,
    Entertainment: 0,
    Education: 0,
    Recharge: 0,
    Groceries: 0,
    Utilities: 0,
    Other: 0,
  });

  // Utilization Stats loaded from backend
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [categoriesMetrics, setCategoriesMetrics] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('');
  const [modalLimit, setModalLimit] = useState('');

  const fetchBudgetMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/budgets/${selectedMonth}`);
      if (res.data.success) {
        const bd = res.data.budget;
        setMonthlyLimit(bd.monthlyLimit || 15000);
        
        // Map category limits
        const caps = { ...categoryLimits };
        Object.keys(caps).forEach(cat => {
          caps[cat] = bd.categoryLimits?.[cat] || 0;
        });
        setCategoryLimits(caps);
        
        // Summary
        setBudgetSummary(res.data.summary);
        setCategoriesMetrics(res.data.categories || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading budget configuration', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetMetrics();
  }, [selectedMonth, refreshTrigger]);

  const handleCategoryLimitChange = (cat, val) => {
    setCategoryLimits((prev) => ({
      ...prev,
      [cat]: Number(val) >= 0 ? Number(val) : 0,
    }));
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.post('/budgets', {
        month: selectedMonth,
        monthlyLimit,
        categoryLimits,
      });

      if (res.data.success) {
        showToast('Budget configuration updated successfully!', 'success');
        fetchBudgetMetrics();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to save budget settings', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategoryLimit = async (e) => {
    e.preventDefault();
    const limitNum = Number(modalLimit);
    if (limitNum < 0) {
      showToast('Budget limit must be a positive number greater than 0', 'danger');
      return;
    }
    try {
      const updatedLimits = { ...categoryLimits };
      updatedLimits[modalCategory] = limitNum;

      const res = await api.post('/budgets', {
        month: selectedMonth,
        monthlyLimit,
        categoryLimits: updatedLimits,
      });

      if (res.data.success) {
        showToast('Budget limit updated', 'success');
        setIsModalOpen(false);
        fetchBudgetMetrics();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to save budget limit', 'danger');
    }
  };

  const getProgressColor = (percent) => {
    if (percent >= 100) return 'bg-rose-500 shadow-[0_0_10px_#f43f5e]';
    if (percent >= 85) return 'bg-amber-500 shadow-[0_0_10px_#f59e0b]';
    return 'bg-emerald-500 shadow-[0_0_10px_#10b981]';
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      
      {/* Date & Core limit selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings panel card */}
        <GlassCard className="lg:col-span-1">
          <div className="pb-4 mb-4 border-b border-themeBorder flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-themePrimary" />
            <h3 className="font-extrabold text-themeText">Budget Allocator</h3>
          </div>

          <form onSubmit={handleSaveBudget} className="space-y-4">
            
            {/* Month Picker */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Target Month</label>
              <input
                type="month"
                required
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="theme-input text-xs py-2.5 w-full font-bold"
              />
            </div>

            {/* Total Limit */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Monthly Spent Cap (Rs.)</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-xs font-black text-themeTextMuted">Rs.</span>
                <input
                  type="number"
                  required
                  placeholder="e.g. 15000"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                  className="theme-input pl-9 w-full text-xs font-bold"
                />
              </div>
            </div>

            {/* Individual Categories Caps scroll */}
            <div className="border-t border-themeBorder/40 pt-4 space-y-3">
              <span className="text-[10px] font-extrabold uppercase text-themeTextMuted block pl-1">Category Spending Limits:</span>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {Object.keys(categoryLimits).map((cat) => (
                  <div key={cat} className="flex justify-between items-center text-xs space-x-3">
                    <span className="font-bold text-themeTextMuted w-24 truncate">{cat}</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-2 text-[10px] font-black text-themeTextMuted">Rs.</span>
                      <input
                        type="number"
                        placeholder="0 (Unlimited)"
                        value={categoryLimits[cat] || ''}
                        onChange={(e) => handleCategoryLimitChange(cat, e.target.value)}
                        className="theme-input py-1.5 pl-8 text-[11px] w-full text-right font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save trigger button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full mt-2 py-2.5 rounded-xl bg-themePrimary text-white shadow-neon-glow hover:bg-themePrimaryHover font-bold text-sm transition-all flex items-center justify-center space-x-1.5"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Update Budget Settings</span>
                </>
              )}
            </button>

          </form>
        </GlassCard>

        {/* Live Gauges & Aggregated metrics */}
        <GlassCard className="lg:col-span-2 flex flex-col justify-between">
          <div className="pb-4 mb-4 border-b border-themeBorder flex items-center justify-between">
            <h3 className="font-extrabold text-themeText flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-themePrimary" />
              <span>Utilization Gauges — {selectedMonth}</span>
            </h3>
            {budgetSummary && (
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg uppercase ${
                budgetSummary.utilizationPercentage >= 100 ? 'bg-rose-500/10 text-rose-400' :
                budgetSummary.utilizationPercentage >= 85 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {budgetSummary.utilizationPercentage}% Spent
              </span>
            )}
          </div>

          {/* Quick Summary tiles */}
          {budgetSummary && (
            <div className="grid grid-cols-3 gap-4 mb-6 text-center select-none text-xs">
              <div className="p-3.5 border border-themeBorder rounded-xl bg-themeBorder/10">
                <p className="text-[10px] text-themeTextMuted font-bold uppercase">Monthly Limit</p>
                <p className="font-black text-themeText text-sm mt-1">₹{budgetSummary.monthlyLimit.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-3.5 border border-themeBorder rounded-xl bg-themeBorder/10">
                <p className="text-[10px] text-themeTextMuted font-bold uppercase">Actual Spent</p>
                <p className="font-black text-rose-500 text-sm mt-1">₹{budgetSummary.totalSpent.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-3.5 border border-themeBorder rounded-xl bg-themeBorder/10">
                <p className="text-[10px] text-themeTextMuted font-bold uppercase">Remaining Cash</p>
                <p className="font-black text-emerald-400 text-sm mt-1">₹{budgetSummary.totalRemaining.toLocaleString('en-IN')}</p>
              </div>
            </div>
          )}

          {/* Category-wise Cards Grid */}
          <div className="flex-1 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-24 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-themePrimary"></div>
              </div>
            ) : categoriesMetrics.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categoriesMetrics.map((cat) => {
                  const isOverrun = cat.spent > cat.limit && cat.limit > 0;
                  return (
                    <div
                      key={cat.category}
                      className="p-4 border border-themeBorder rounded-xl bg-themeBorder/5 flex flex-col justify-between space-y-3 relative hover:border-themePrimary/40 transition-all"
                    >
                      {/* Sub-div containing h4 matching xpath //div[div[h4[text()='Food']]] */}
                      <div>
                        <h4 className="font-extrabold text-sm text-themeText">{cat.category}</h4>
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-themeTextMuted">Spent: ₹{cat.spent.toLocaleString('en-IN')}</span>
                          <span className="text-themeText font-bold">Limit: {cat.limit > 0 ? `₹${cat.limit.toLocaleString('en-IN')}` : 'No Cap'}</span>
                        </div>

                        {/* Progress Bar background */}
                        {cat.limit > 0 ? (
                          <div className="w-full h-2.5 bg-themeBorder rounded-full overflow-hidden relative border border-themeBorder">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(cat.percentage)}`}
                              style={{ width: `${Math.min(100, cat.percentage)}%` }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-2.5 bg-themeBorder/30 rounded-full border border-themeBorder/10" />
                        )}

                        <div className="flex justify-between items-center text-[10px] font-black text-themeText pt-1">
                          {isOverrun ? (
                            <span className="text-rose-500 font-bold flex items-center space-x-1 animate-pulse">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Exceeded!</span>
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="bg-themeBorder px-1.5 py-0.5 rounded">
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Edit Button inside outer div */}
                      <button
                        type="button"
                        onClick={() => {
                          setModalCategory(cat.category);
                          setModalLimit(cat.limit || '');
                          setIsModalOpen(true);
                        }}
                        className="w-full py-1.5 rounded-lg bg-themePrimary/10 hover:bg-themePrimary text-themePrimary hover:text-white font-bold text-xs transition-all border border-themePrimary/20 flex items-center justify-center space-x-1"
                      >
                        Set Limit
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-themeTextMuted flex flex-col items-center">
                <TrendingDown className="w-12 h-12 mb-2 text-themeBorder" />
                <p className="text-xs font-bold">Configure overall & category limit caps on the settings panel</p>
              </div>
            )}
          </div>
        </GlassCard>

      </div>

      {/* Set Category Limit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-sm relative p-6">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-themeBorder">
              <h3 className="text-base font-extrabold text-themeText">Set Budget Limit</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-themeTextMuted hover:text-themeText hover:bg-themeBorder transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryLimit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-themeTextMuted uppercase block mb-1">
                  Limit for {modalCategory} (Rs.)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={modalLimit}
                  onChange={(e) => setModalLimit(e.target.value)}
                  className="theme-input w-full text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-themeBorder text-themeText hover:bg-themeBorder/80 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-themePrimary text-white hover:bg-themePrimaryHover font-bold text-xs shadow-neon-glow transition-all"
                >
                  Save Budget Limit
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

    </div>
  );
};

export default Budgets;
