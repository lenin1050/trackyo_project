import React, { useState, useEffect } from 'react';
import api from '../services/api';
import GlassCard from '../components/GlassCard';
import { 
  Search, 
  Trash2, 
  Edit3, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ListFilter,
  Calendar,
  AlertTriangle,
  ArrowUpDown,
  X,
  Plus
} from 'lucide-react';

const Transactions = ({ onEditExpense, showToast, refreshTrigger }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Query Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // default: newest
  const [page, setPage] = useState(1);

  // Inline Quick Add Expense form states for test expectations
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineAmount, setInlineAmount] = useState('');
  const [inlineMerchant, setInlineMerchant] = useState('');
  const [inlineCategory, setInlineCategory] = useState('');

  const categories = [
    'All',
    'Food',
    'Travel',
    'Shopping',
    'Bills',
    'Health',
    'Entertainment',
    'Education',
    'Recharge',
    'Groceries',
    'Utilities',
    'Other',
  ];

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 8,
        search: search.trim() || undefined,
        category: category !== 'All' ? category : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
      };

      const res = await api.get('/expenses', { params });
      if (res.data.success) {
        setExpenses(res.data.data);
        setTotalCount(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading transaction history ledger', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [page, category, sortBy, refreshTrigger]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExpenses();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setStartDate('');
    setEndDate('');
    setSortBy('date_desc');
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this expense log?')) return;
    try {
      setLoading(true);
      const res = await api.delete(`/expenses/${id}`);
      if (res.data.success) {
        showToast('Transaction log deleted successfully', 'success');
        fetchExpenses();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete transaction', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleInlineSubmit = async (e) => {
    e.preventDefault();
    if (!inlineAmount || !inlineMerchant || !inlineCategory) {
      showToast('Amount, Merchant and Category are required', 'warning');
      return;
    }

    try {
      const res = await api.post('/expenses', {
        title: `${inlineMerchant} Purchase`,
        amount: Number(inlineAmount),
        category: inlineCategory,
        merchantName: inlineMerchant,
        paymentMethod: 'UPI',
        isAutomated: false,
        dateTime: new Date().toISOString(),
      });

      if (res.data.success) {
        showToast('Expense recorded successfully', 'success');
        setInlineAmount('');
        setInlineMerchant('');
        setInlineCategory('');
        setShowInlineForm(false);
        fetchExpenses();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Error saving expense';
      showToast(errMsg, 'danger');
    }
  };

  const handleExportCSV = async () => {
    try {
      showToast('Exporting transaction history...', 'info');
      const res = await api.get('/expenses', { params: { exportAll: true } });
      if (res.data.success && res.data.data.length > 0) {
        const dataToExport = res.data.data;
        const headers = ['Title', 'Amount (INR)', 'Category', 'Payment Method', 'Merchant Name', 'Date', 'Notes', 'Automated'];
        const rows = dataToExport.map(exp => [
          `"${exp.title.replace(/"/g, '""')}"`,
          exp.amount,
          `"${exp.category}"`,
          `"${exp.paymentMethod}"`,
          `"${exp.merchantName.replace(/"/g, '""')}"`,
          `"${new Date(exp.dateTime).toISOString().slice(0, 10)}"`,
          `"${(exp.notes || '').replace(/"/g, '""')}"`,
          exp.isAutomated ? 'Yes' : 'No'
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `trackyo_expense_history_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('CSV ledger downloaded successfully!', 'success');
      } else {
        showToast('No transaction data available to export', 'warning');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to export CSV', 'danger');
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      
      {/* Title & Add triggers */}
      <div className="flex justify-between items-center pl-1">
        <div>
          <h3 className="text-sm font-extrabold tracking-wide uppercase text-themeTextMuted">Transactions Ledger</h3>
        </div>
        <button
          onClick={() => setShowInlineForm(prev => !prev)}
          className="py-2 px-4 rounded-xl bg-themePrimary text-white shadow-neon-glow hover:bg-themePrimaryHover text-xs font-bold transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Expense</span>
        </button>
      </div>

      {/* Quick Add Inline Form */}
      {showInlineForm && (
        <GlassCard className="p-6 border border-themePrimary/40 animate-in fade-in duration-200">
          <div className="flex justify-between items-center pb-3 mb-4 border-b border-themeBorder">
            <h3 className="text-base font-extrabold text-themeText">Quick Add Expense</h3>
            <button
              type="button"
              onClick={() => setShowInlineForm(false)}
              className="p-1 rounded-lg text-themeTextMuted hover:text-themeText hover:bg-themeBorder transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleInlineSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1">Amount (Rs.)*</label>
                <input
                  type="number"
                  name="amount"
                  required
                  placeholder="0.00"
                  value={inlineAmount}
                  onChange={(e) => setInlineAmount(e.target.value)}
                  className="theme-input text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1">Merchant / Store Name*</label>
                <input
                  type="text"
                  name="merchant"
                  required
                  placeholder="e.g. Swiggy, Zomato"
                  value={inlineMerchant}
                  onChange={(e) => setInlineMerchant(e.target.value)}
                  className="theme-input text-xs"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1">Category*</label>
                <select
                  name="category"
                  required
                  value={inlineCategory}
                  onChange={(e) => setInlineCategory(e.target.value)}
                  className="theme-input text-xs w-full"
                >
                  <option value="" disabled className="bg-slate-900 text-white">Select Category</option>
                  {categories.filter(c => c !== 'All').map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInlineForm(false)}
                className="px-4 py-2 rounded-lg bg-themeBorder text-themeText hover:bg-themeBorder/80 font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-themePrimary text-white hover:bg-themePrimaryHover font-bold text-xs shadow-neon-glow transition-all"
              >
                Save Expense
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Search and Filters Glass Grid */}
      <GlassCard>
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Search Input */}
            <div className="flex flex-col relative md:col-span-2">
              <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Search Keywords</label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-4.5 h-4.5 text-themeTextMuted" />
                <input
                  type="text"
                  placeholder="Search by title, description or store..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="theme-input pl-10 w-full text-xs"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Filter by Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="theme-input text-xs w-full"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Sorting Order</label>
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-3.5 w-4 h-4 text-themeTextMuted" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="theme-input pl-10 text-xs w-full font-bold"
                >
                  <option value="date_desc" className="bg-slate-900 text-white">Date: Newest First</option>
                  <option value="date_asc" className="bg-slate-900 text-white">Date: Oldest First</option>
                  <option value="amount_desc" className="bg-slate-900 text-white">Amount: High to Low</option>
                  <option value="amount_asc" className="bg-slate-900 text-white">Amount: Low to High</option>
                </select>
              </div>
            </div>

          </div>

          {/* Date range filters and buttons */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 border-t border-themeBorder/40">
            
            {/* Date Pickers */}
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1 flex items-center pl-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>Start Date</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="theme-input py-2.5 text-xs w-full"
                />
              </div>
              
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1 flex items-center pl-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>End Date</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="theme-input py-2.5 text-xs w-full"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 select-none">
              <button
                type="button"
                onClick={handleResetFilters}
                className="py-2.5 px-4 rounded-xl border border-themeBorder text-xs font-bold text-themeText hover:bg-themeBorder transition-all"
              >
                Reset All
              </button>
              
              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl bg-themePrimary text-white shadow-neon-glow hover:bg-themePrimaryHover text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Apply Filters</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

          </div>
        </form>
      </GlassCard>

      {/* Results Table list */}
      <GlassCard>
        <div className="flex justify-between items-center mb-6 pl-1">
          <h4 className="text-sm font-extrabold tracking-wide uppercase text-themeTextMuted">
            Ledger Transaction Records ({totalCount})
          </h4>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-24 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-themePrimary"></div>
            </div>
          ) : expenses.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-themeBorder text-themeTextMuted font-bold uppercase tracking-wider">
                  <th className="pb-3.5 pl-2">Details</th>
                  <th className="pb-3.5">Category</th>
                  <th className="pb-3.5">Payment Method</th>
                  <th className="pb-3.5">Merchant</th>
                  <th className="pb-3.5">Notes</th>
                  <th className="pb-3.5 text-right">Amount</th>
                  <th className="pb-3.5 text-center pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-themeBorder/40">
                {expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-themeBorder/20 transition-all font-semibold">
                    <td className="py-3.5 pl-2">
                      <div>
                        <p className="font-extrabold text-themeText flex items-center">
                          <span>{exp.title}</span>
                          {exp.isAutomated && (
                            <span className="ml-2 text-[8px] bg-themePrimary/10 text-themePrimary px-1 rounded uppercase tracking-widest font-black">
                              Auto
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-themeTextMuted mt-0.5">
                          {new Date(exp.dateTime).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="bg-themeBorder text-themeText px-2.5 py-1 rounded-lg">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5">{exp.paymentMethod}</td>
                    <td className="py-3.5 font-bold text-themeTextMuted">{exp.merchantName}</td>
                    <td className="py-3.5 max-w-xs truncate font-medium text-themeTextMuted">{exp.notes || '-'}</td>
                    <td className="py-3.5 text-right font-black text-rose-500 text-sm">
                      -₹{Number(exp.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-center pr-2">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onEditExpense(exp._id)}
                          className="p-2 rounded-lg border border-themeBorder hover:bg-themeBorder hover:text-themePrimary text-themeTextMuted transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp._id)}
                          className="p-2 rounded-lg border border-themeBorder hover:bg-rose-500/10 hover:text-rose-500 text-themeTextMuted transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-20 text-themeTextMuted flex flex-col items-center">
              <AlertTriangle className="w-12 h-12 mb-2 text-amber-500" />
              <p className="text-xs font-extrabold">No transactions matched your filter queries</p>
              <button
                onClick={handleResetFilters}
                className="mt-3 py-1.5 px-4 rounded-xl bg-themeBorder text-[10px] uppercase font-bold text-themeText transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination Drawer bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-themeBorder pt-6 mt-6 pl-1">
            <span className="text-xs text-themeTextMuted font-semibold">
              Showing page <span className="text-themeText font-bold">{page}</span> of{' '}
              <span className="text-themeText font-bold">{totalPages}</span> ({totalCount} items)
            </span>
            
            <div className="flex items-center space-x-2 select-none">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-themeBorder text-themeTextMuted hover:text-themeText disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-themeBorder text-themeTextMuted hover:text-themeText disabled:opacity-40 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </GlassCard>

    </div>
  );
};

export default Transactions;
