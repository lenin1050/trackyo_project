import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, Calendar, DollarSign, Tag, FileText, Zap, Sparkles } from 'lucide-react';
import GlassCard from './GlassCard';

const ExpenseModal = ({ isOpen, onClose, expenseId, onSave, showToast }) => {
  const [loading, setLoading] = useState(false);
  const [aiPredicting, setAiPredicting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Other',
    paymentMethod: 'UPI',
    merchantName: '',
    dateTime: new Date().toISOString().slice(0, 16),
    notes: '',
    receiptImage: '',
  });

  const categories = [
    'Food',
    'Travel',
    'Shopping',
    'Bills',
    'Health',
    'Entertainment',
    'Education',
    'Recharge',
    'Groceries',
    'Other',
  ];

  const paymentMethods = ['UPI', 'Card', 'Cash', 'NetBanking'];

  // Load existing expense if edit mode
  useEffect(() => {
    if (expenseId && isOpen) {
      const fetchExpense = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/expenses/${expenseId}`);
          if (res.data.success) {
            const exp = res.data.data;
            setFormData({
              title: exp.title || '',
              amount: exp.amount || '',
              category: exp.category || 'Other',
              paymentMethod: exp.paymentMethod || 'UPI',
              merchantName: exp.merchantName || '',
              dateTime: exp.dateTime ? new Date(exp.dateTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
              notes: exp.notes || '',
              receiptImage: exp.receiptImage || '',
            });
          }
        } catch (err) {
          console.error(err);
          showToast('Failed to fetch expense details', 'danger');
        } finally {
          setLoading(false);
        }
      };
      fetchExpense();
    } else {
      setFormData({
        title: '',
        amount: '',
        category: 'Other',
        paymentMethod: 'UPI',
        merchantName: '',
        dateTime: new Date().toISOString().slice(0, 16),
        notes: '',
        receiptImage: '',
      });
    }
  }, [expenseId, isOpen]);

  // Real-time AI categorization prediction
  const predictCategory = async (textToScan) => {
    if (!textToScan || textToScan.trim().length < 3) return;
    try {
      setAiPredicting(true);
      const res = await api.post('/ai/categorize', { text: textToScan });
      if (res.data.success && res.data.category) {
        setFormData((prev) => ({ ...prev, category: res.data.category }));
      }
    } catch (e) {
      console.warn('Real-time AI categorization prediction failed: ', e);
    } finally {
      setAiPredicting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTitleBlur = () => {
    // If merchant name is empty, try to predict category from title
    if (!formData.merchantName) {
      predictCategory(formData.title);
    }
  };

  const handleMerchantBlur = () => {
    predictCategory(formData.merchantName || formData.title);
  };

  // Convert uploaded receipt image to base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, receiptImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      showToast('Title and Amount are required fields', 'warning');
      return;
    }

    try {
      setLoading(true);
      let res;
      if (expenseId) {
        // Edit mode
        res = await api.put(`/expenses/${expenseId}`, formData);
      } else {
        // Create mode
        res = await api.post('/expenses', formData);
      }

      if (res.data.success) {
        showToast(expenseId ? 'Expense log modified successfully' : 'Expense recorded successfully', 'success');
        onSave();
        onClose();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Error saving transaction', 'danger');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <GlassCard className="w-full max-w-xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-themeBorder">
          <h3 className="text-lg font-extrabold text-themeText flex items-center space-x-2">
            <Tag className="w-5 h-5 text-themePrimary" />
            <span>{expenseId ? 'Edit Transaction' : 'Record New Expense'}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-themeTextMuted hover:text-themeText hover:bg-themeBorder transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="py-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-themePrimary"></div>
          </div>
        )}

        {!loading && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Title & Amount Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Expense Title*</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Biryani Lunch"
                  value={formData.title}
                  onChange={handleInputChange}
                  onBlur={handleTitleBlur}
                  className="theme-input"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Amount (Rs.)*</label>
                <div className="relative">
                  <div className="absolute left-3 top-3.5 text-themeTextMuted">
                    <span className="font-bold text-xs">Rs.</span>
                  </div>
                  <input
                    type="number"
                    name="amount"
                    required
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="theme-input pl-9 w-full"
                  />
                </div>
              </div>
            </div>

            {/* Category & Payment Method Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col relative">
                <label className="text-xs font-bold text-themeTextMuted uppercase mb-1.5 pl-1 flex items-center space-x-1">
                  <span>Category</span>
                  {aiPredicting && <Zap className="w-3.5 h-3.5 text-amber-500 animate-bounce" />}
                  {!aiPredicting && (
                    <span className="flex items-center text-[9px] bg-themePrimary/10 text-themePrimary px-1 rounded ml-1 animate-pulse">
                      <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI Enabled
                    </span>
                  )}
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="theme-input w-full"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="theme-input w-full"
                >
                  {paymentMethods.map((pm) => (
                    <option key={pm} value={pm} className="bg-slate-900 text-white">
                      {pm}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Merchant Name & Date Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Merchant / Store Name</label>
                <input
                  type="text"
                  name="merchantName"
                  placeholder="e.g. Swiggy, Uber, Zomato"
                  value={formData.merchantName}
                  onChange={handleInputChange}
                  onBlur={handleMerchantBlur}
                  className="theme-input"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Date & Time</label>
                <input
                  type="datetime-local"
                  name="dateTime"
                  value={formData.dateTime}
                  onChange={handleInputChange}
                  className="theme-input"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Transaction Notes</label>
              <textarea
                name="notes"
                placeholder="Details of purchase..."
                value={formData.notes}
                onChange={handleInputChange}
                rows="2"
                className="theme-input resize-none"
              />
            </div>

            {/* Receipt Image Upload */}
            <div className="flex flex-col border border-dashed border-themeBorder p-4 rounded-xl">
              <label className="text-xs font-bold text-themeTextMuted uppercase mb-2">Scan Receipt Image</label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-xs text-themeTextMuted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-themeBorder file:text-themeText hover:file:bg-themePrimary hover:file:text-white file:transition-all cursor-pointer"
                />
                {formData.receiptImage && (
                  <div className="relative w-12 h-12 rounded-lg border border-themeBorder overflow-hidden">
                    <img src={formData.receiptImage} alt="Receipt Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, receiptImage: '' }))}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center text-rose-500 opacity-0 hover:opacity-100 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3 pt-4 border-t border-themeBorder">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-themeBorder text-themeText font-bold text-sm transition-all hover:bg-themeBorder"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-themePrimary text-white shadow-neon-glow hover:bg-themePrimaryHover font-bold text-sm transition-all flex items-center justify-center space-x-1.5"
              >
                <span>{expenseId ? 'Save Edits' : 'Add Expense'}</span>
              </button>
            </div>

          </form>
        )}

      </GlassCard>
    </div>
  );
};

export default ExpenseModal;
