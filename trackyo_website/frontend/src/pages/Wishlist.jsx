import React, { useState, useEffect } from 'react';
import api from '../services/api';
import GlassCard from '../components/GlassCard';
import { Heart, Plus, Target, CheckCircle2, Trash2, Calendar, PiggyBank, Sparkles, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Wishlist = ({ showToast, refreshTrigger }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields State (using title instead of goalName)
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    targetDate: '',
    imageUrl: '',
  });

  // Piggy Bank Transaction Modal State
  const [showPiggyModal, setShowPiggyModal] = useState(false);
  const [piggyMode, setPiggyMode] = useState('deposit'); // 'deposit' or 'withdraw'
  const [piggyGoal, setPiggyGoal] = useState(null);
  const [piggyAmount, setPiggyAmount] = useState('');
  const [piggySaving, setPiggySaving] = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/savings');
      if (res.data.success) {
        setGoals(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading savings goals', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [refreshTrigger]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGoal((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.targetAmount) {
      showToast('Item Title and Target Amount are required', 'warning');
      return;
    }

    try {
      setSaving(true);
      // Fallback for targetDate if not filled (e.g. 1 year from now)
      const payload = {
        ...newGoal,
        targetDate: newGoal.targetDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      const res = await api.post('/savings', payload);
      if (res.data.success) {
        showToast('New item added to wishlist!', 'success');
        fetchGoals();
        setShowAddModal(false);
        setNewGoal({ title: '', targetAmount: '', targetDate: '', imageUrl: '' });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to add wishlist item', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handlePiggySubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(piggyAmount);
    if (amountNum <= 0) {
      showToast('Transaction amount must be a positive number greater than 0', 'danger');
      return;
    }

    if (piggyMode === 'deposit') {
      const remaining = piggyGoal.targetAmount - piggyGoal.currentAmount;
      if (amountNum > remaining) {
        showToast('Deposit amount exceeds the remaining limit', 'danger');
        return;
      }
    } else {
      if (amountNum > piggyGoal.currentAmount) {
        showToast('Cannot withdraw more than current saved amount', 'danger');
        return;
      }
    }

    try {
      setPiggySaving(true);
      const url = `/savings/${piggyGoal._id}/${piggyMode}`;
      const res = await api.post(url, { amount: amountNum });
      if (res.data.success) {
        if (piggyMode === 'deposit') {
          if (res.data.data.isCompleted && !piggyGoal.isCompleted) {
            showToast('🎉 Congratulations! You completed your savings goal!', 'success');
          } else {
            showToast(`Successfully deposited ₹${amountNum}!`, 'success');
          }
        } else {
          showToast(`Successfully withdrawn ₹${amountNum}!`, 'success');
        }
        setShowPiggyModal(false);
        setPiggyAmount('');
        fetchGoals();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Transaction failed';
      showToast(errMsg, 'danger');
    } finally {
      setPiggySaving(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      setLoading(true);
      const res = await api.delete(`/savings/${id}`);
      if (res.data.success) {
        showToast('Wishlist item deleted successfully', 'success');
        fetchGoals();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to remove goal', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      
      {/* Page Title & Add triggers */}
      <div className="flex justify-between items-center pl-1">
        <div>
          <h3 className="text-sm font-extrabold tracking-wide uppercase text-themeTextMuted">Wishlist Savings Goal</h3>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="py-2 px-4 rounded-xl bg-themePrimary text-white shadow-neon-glow hover:bg-themePrimaryHover text-xs font-bold transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Wishlist Item</span>
        </button>
      </div>

      {/* Goals Card Grid */}
      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-themePrimary"></div>
        </div>
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.floor((goal.currentAmount / goal.targetAmount) * 100));
            const isCompleted = goal.isCompleted;
            const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
            
            return (
              /* Outer div container matching //div[div[h4[text()='MacBook Pro']]] */
              <div key={goal._id} className="bg-themeBorder/10 border border-themeBorder/60 rounded-2xl p-4 flex flex-col justify-between h-96 relative group hover:border-themePrimary/40 transition-all duration-300">
                
                {/* Header Sub-div containing h4 */}
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-base text-themeText truncate">{goal.goalName || goal.title}</h4>
                    <p className="text-[10px] text-themeTextMuted mt-0.5 uppercase tracking-wider">Wishlist Item</p>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal._id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all text-[10px] font-bold"
                  >
                    Delete
                  </button>
                </div>

                {/* Progress bar info */}
                <div className="space-y-2 mt-4 select-none">
                  <div className="flex justify-between items-center text-[10px] font-bold text-themeTextMuted">
                    <span>SAVED PERCENTAGE</span>
                    <span className="font-black text-themeText">{pct}%</span>
                  </div>

                  <div className="w-full h-2.5 bg-themeBorder rounded-full overflow-hidden relative border border-themeBorder">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-themePrimary shadow-[0_0_10px_var(--primary-accent)]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Pricing specifics */}
                <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-themeBorder/40 my-4 select-none">
                  <div>
                    <p className="text-[10px] text-themeTextMuted uppercase font-bold">Goal Target</p>
                    <p className="font-black text-themeText mt-0.5">₹{goal.targetAmount.toLocaleString('en-US')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-themeTextMuted uppercase font-bold">Total Saved</p>
                    <p className="font-black text-emerald-400 mt-0.5">₹{goal.currentAmount.toLocaleString('en-US')}</p>
                  </div>
                </div>

                {/* Completion and Date tags */}
                <div className="flex justify-between items-center pb-4">
                  <span className="text-[10px] text-themeTextMuted font-semibold flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    {daysLeft > 0 ? (
                      <span>{daysLeft} days left</span>
                    ) : daysLeft === 0 ? (
                      <span>Deadline today!</span>
                    ) : (
                      <span>Overdue</span>
                    )}
                  </span>

                  {isCompleted ? (
                    <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg flex items-center space-x-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Achieved</span>
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase text-themePrimary bg-themePrimary/15 px-2 py-0.5 rounded-lg flex items-center space-x-0.5">
                      <Target className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  )}
                </div>

                {/* Deposit & Withdraw Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-themeBorder/40">
                  <button
                    onClick={() => {
                      setPiggyGoal(goal);
                      setPiggyMode('deposit');
                      setPiggyAmount('');
                      setShowPiggyModal(true);
                    }}
                    disabled={isCompleted}
                    className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 transition-all ${
                      isCompleted 
                      ? 'bg-themeBorder/40 text-themeTextMuted cursor-not-allowed' 
                      : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Deposit</span>
                  </button>
                  <button
                    onClick={() => {
                      setPiggyGoal(goal);
                      setPiggyMode('withdraw');
                      setPiggyAmount('');
                      setShowPiggyModal(true);
                    }}
                    className="py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 font-bold text-xs flex items-center justify-center space-x-1 transition-all"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Withdraw</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-themeTextMuted flex flex-col items-center">
          <Heart className="w-12 h-12 mb-2 text-themeBorder animate-pulse" />
          <p className="text-xs font-bold">No wishlist goals set yet. Save up for your dreams!</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 py-2 px-6 rounded-xl bg-themePrimary text-white shadow-neon-glow hover:bg-themePrimaryHover text-xs font-bold transition-all"
          >
            Create Your First Goal
          </button>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <GlassCard className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-themeBorder">
              <h3 className="text-lg font-extrabold text-themeText">Add New Wishlist Item</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-themeTextMuted hover:text-themeText hover:bg-themeBorder transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs */}
            <form onSubmit={handleCreateGoal} className="space-y-4">
              
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Item Title*</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. MacBook Pro, Goa Holiday"
                  value={newGoal.title}
                  onChange={handleInputChange}
                  className="theme-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Target Amount (Rs.)*</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[10px] font-black text-themeTextMuted">Rs.</span>
                    <input
                      type="number"
                      name="targetAmount"
                      required
                      placeholder="0.00"
                      value={newGoal.targetAmount}
                      onChange={handleInputChange}
                      className="theme-input pl-7 text-xs w-full font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Target Date (Optional)</label>
                  <input
                    type="date"
                    name="targetDate"
                    value={newGoal.targetDate}
                    onChange={handleInputChange}
                    className="theme-input py-2 text-xs w-full font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Item Image URL (Optional)</label>
                <input
                  type="url"
                  name="imageUrl"
                  placeholder="https://example.com/item.png"
                  value={newGoal.imageUrl}
                  onChange={handleInputChange}
                  className="theme-input text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-themeBorder">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 px-4 rounded-xl border border-themeBorder text-themeText font-bold text-xs hover:bg-themeBorder transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 px-4 rounded-xl bg-themePrimary text-white shadow-neon-glow hover:bg-themePrimaryHover font-bold text-xs transition-all flex items-center justify-center space-x-1"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    'Add Item'
                  )}
                </button>
              </div>

            </form>

          </GlassCard>
        </div>
      )}

      {/* Piggy Bank Deposit/Withdraw Modal */}
      {showPiggyModal && piggyGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
          <GlassCard className="w-full max-w-sm relative p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-themeBorder">
              <h3 className="text-base font-extrabold text-themeText">
                Piggy Bank - {piggyMode === 'deposit' ? 'Deposit' : 'Withdrawal'}
              </h3>
              <button
                onClick={() => setShowPiggyModal(false)}
                className="p-1 rounded-lg text-themeTextMuted hover:text-themeText hover:bg-themeBorder transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-themeTextMuted mb-4">
              Goal: <span className="font-bold text-themeText">{piggyGoal.goalName || piggyGoal.title}</span>
            </p>

            <form onSubmit={handlePiggySubmit} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5">
                  Amount to {piggyMode === 'deposit' ? 'Deposit' : 'Withdraw'} (Rs.)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs font-black text-themeTextMuted">₹</span>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={piggyAmount}
                    onChange={(e) => setPiggyAmount(e.target.value)}
                    className="theme-input pl-7 text-xs w-full font-bold"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPiggyModal(false)}
                  className="flex-1 py-2 rounded-lg bg-themeBorder text-themeText hover:bg-themeBorder/80 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={piggySaving}
                  className="flex-1 py-2 rounded-lg bg-themePrimary text-white hover:bg-themePrimaryHover font-bold text-xs transition-all shadow-neon-glow"
                >
                  {piggySaving ? 'Processing...' : 'Confirm Transaction'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

    </div>
  );
};

export default Wishlist;
