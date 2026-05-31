import React, { useState, useEffect } from 'react';
import api from '../services/api';
import GlassCard from '../components/GlassCard';
import { Heart, Plus, Target, CheckCircle2, Trash2, Calendar, PiggyBank, Sparkles, X } from 'lucide-react';

const Wishlist = ({ showToast, refreshTrigger }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields State
  const [newGoal, setNewGoal] = useState({
    goalName: '',
    targetAmount: '',
    targetDate: '',
    imageUrl: '',
  });

  // Deposit Fields
  const [depositAmount, setDepositAmount] = useState('');
  const [activeDepositId, setActiveDepositId] = useState(null);
  const [depositing, setDepositing] = useState(false);

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
    if (!newGoal.goalName || !newGoal.targetAmount || !newGoal.targetDate) {
      showToast('Goal Name, Target Amount and Date are required', 'warning');
      return;
    }

    try {
      setSaving(true);
      const res = await api.post('/savings', newGoal);
      if (res.data.success) {
        showToast('New savings wishlist goal created!', 'success');
        fetchGoals();
        setShowAddModal(false);
        setNewGoal({ goalName: '', targetAmount: '', targetDate: '', imageUrl: '' });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to create savings goal', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDepositSubmit = async (e, id) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) {
      showToast('Please specify a valid deposit amount', 'warning');
      return;
    }

    try {
      setDepositing(true);
      const res = await api.post(`/savings/${id}/deposit`, { amount: Number(depositAmount) });
      if (res.data.success) {
        showToast(`Successfully saved ₹${depositAmount} towards your goal!`, 'success');
        setDepositAmount('');
        setActiveDepositId(null);
        fetchGoals();
        
        // Simulating celebratory sound chime
        try {
          const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-500.wav');
          chime.volume = 0.2;
          chime.play();
        } catch (err) {
          // browser blocks autoplay
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to deposit funds', 'danger');
    } finally {
      setDepositing(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this wishlist goal?')) return;
    try {
      setLoading(true);
      const res = await api.delete(`/savings/${id}`);
      if (res.data.success) {
        showToast('Wishlist goal removed successfully', 'success');
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
          <h3 className="text-sm font-extrabold tracking-wide uppercase text-themeTextMuted">Savings Milestones & Wishlist</h3>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="py-2 px-4 rounded-xl bg-themePrimary text-white shadow-neon-glow hover:bg-themePrimaryHover text-xs font-bold transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Wishlist Goal</span>
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
              <GlassCard key={goal._id} className="relative overflow-hidden flex flex-col justify-between h-96 group">
                
                {/* Image Cover */}
                <div className="absolute top-0 left-0 w-full h-32 overflow-hidden border-b border-themeBorder">
                  <img
                    src={goal.imageUrl || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}
                    alt={goal.goalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  
                  {/* Delete trigger */}
                  <button
                    onClick={() => handleDeleteGoal(goal._id)}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-rose-500 text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="absolute bottom-3 left-4 pr-4">
                    <h4 className="font-extrabold text-sm text-white truncate">{goal.goalName}</h4>
                  </div>
                </div>

                {/* Content details */}
                <div className="mt-28 flex-1 flex flex-col justify-between py-2 text-xs">
                  
                  {/* Progress bar info */}
                  <div className="space-y-2 select-none">
                    <div className="flex justify-between items-center text-[10px] font-bold text-themeTextMuted">
                      <span>SAVINGS TARGET METRIC</span>
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
                  <div className="grid grid-cols-2 gap-2 text-xs py-3 select-none">
                    <div>
                      <p className="text-[10px] text-themeTextMuted uppercase font-bold">Goal Target</p>
                      <p className="font-black text-themeText mt-0.5">₹{goal.targetAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-themeTextMuted uppercase font-bold">Total Saved</p>
                      <p className="font-black text-emerald-400 mt-0.5">₹{goal.currentAmount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Completion and Date tags */}
                  <div className="flex justify-between items-center pt-2.5 border-t border-themeBorder/40">
                    <span className="text-[10px] text-themeTextMuted font-semibold flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {daysLeft > 0 ? (
                        <span>{daysLeft} days remaining</span>
                      ) : daysLeft === 0 ? (
                        <span>Deadline today!</span>
                      ) : (
                        <span>Overdue by {Math.abs(daysLeft)} days</span>
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

                  {/* Deposit inputs */}
                  {!isCompleted && (
                    <div className="mt-4 border-t border-themeBorder/40 pt-4 select-none">
                      {activeDepositId === goal._id ? (
                        <form onSubmit={(e) => handleDepositSubmit(e, goal._id)} className="flex items-center space-x-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-2 text-[10px] font-black text-themeTextMuted">₹</span>
                            <input
                              type="number"
                              required
                              placeholder="Amount"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              className="theme-input py-1.5 pl-5 text-[11px] w-full text-right font-bold"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={depositing}
                            className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] uppercase font-black transition-all shadow-glass"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveDepositId(null)}
                            className="p-1.5 rounded-lg border border-themeBorder text-rose-500 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveDepositId(goal._id);
                            setDepositAmount('');
                          }}
                          className="w-full py-2 rounded-lg bg-themeBorder hover:bg-themePrimary hover:text-white transition-all text-xs font-bold flex items-center justify-center space-x-1"
                        >
                          <PiggyBank className="w-4 h-4" />
                          <span>Deposit Funds</span>
                        </button>
                      )}
                    </div>
                  )}

                </div>

              </GlassCard>
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
              <h3 className="text-lg font-extrabold text-themeText flex items-center space-x-2">
                <Heart className="w-5 h-5 text-themePrimary" />
                <span>Add Wishlist Milestone</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-themeTextMuted hover:text-themeText hover:bg-themeBorder transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs */}
            <form onSubmit={handleCreateGoal} className="space-y-4">
              
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Goal / Item Name*</label>
                <input
                  type="text"
                  name="goalName"
                  required
                  placeholder="e.g. MacBook Pro, Goa Holiday"
                  value={newGoal.goalName}
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
                  <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Target Date*</label>
                  <input
                    type="date"
                    name="targetDate"
                    required
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
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Create Goal</span>
                    </>
                  )}
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
