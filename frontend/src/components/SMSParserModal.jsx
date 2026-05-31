import React, { useState } from 'react';
import api from '../services/api';
import { X, MessageSquare, Sparkles, Send, Check, ShieldAlert, Cpu } from 'lucide-react';
import GlassCard from './GlassCard';

const SMSParserModal = ({ isOpen, onClose, onSave, showToast }) => {
  const [smsText, setSmsText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState('');

  const sampleSMS = [
    "Rs.450 spent on Swiggy using HDFC Card.",
    "Debited from SBI A/c: Rs. 799 spent at Netflix Prime.",
    "Your Axis Bank card was spent with INR 1200 on Amazon Shopping.",
    "Rs.99 recharge on Jio JioFiber was successful."
  ];

  const handleParse = async () => {
    if (!smsText.trim()) {
      showToast('Please type or paste a transaction SMS text first', 'warning');
      return;
    }

    try {
      setParsing(true);
      setParsedData(null);
      
      const res = await api.post('/ai/parse-sms', { smsText });
      if (res.data.success && res.data.data) {
        setParsedData(res.data.data);
        setSource(res.data.source || 'Local Rules Engine');
        showToast('SMS Alert parsed successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error parsing SMS alert. Try again!', 'danger');
    } finally {
      setParsing(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!parsedData) return;
    try {
      setSaving(true);
      // Create expense in database
      const res = await api.post('/expenses', {
        title: parsedData.title,
        amount: parsedData.amount,
        category: parsedData.category,
        merchantName: parsedData.merchantName,
        paymentMethod: parsedData.bank.toLowerCase().includes('card') ? 'Card' : 'UPI',
        isAutomated: true,
        notes: `Simulated Bank SMS parsed. [Bank: ${parsedData.bank}]`
      });

      if (res.data.success) {
        showToast('Expense created automatically from SMS parsing!', 'success');
        onSave();
        onClose();
        setParsedData(null);
        setSmsText('');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to record transaction', 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <GlassCard className="w-full max-w-lg relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-themeBorder">
          <h3 className="text-lg font-extrabold text-themeText flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-themePrimary" />
            <span>SMS Transaction Simulator</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-themeTextMuted hover:text-themeText hover:bg-themeBorder transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-themeTextMuted leading-relaxed">
            Pasting transaction alerts here simulates Trackyo's background Android SMS receiver. It extracts metrics dynamically using the Gemini API.
          </p>

          {/* Quick Mock Sample Buttons */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-themeTextMuted pl-1">Load Demo SMS Templates:</span>
            <div className="grid grid-cols-1 gap-1.5">
              {sampleSMS.map((sms, i) => (
                <button
                  key={i}
                  onClick={() => setSmsText(sms)}
                  className="text-left text-[11px] p-2.5 rounded-lg bg-themeBorder hover:bg-themePrimary/15 border border-themeBorder hover:border-themePrimary/40 text-themeText font-semibold truncate transition-all"
                >
                  "{sms}"
                </button>
              ))}
            </div>
          </div>

          {/* Input Text Area */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Raw SMS Alert Text</label>
            <textarea
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="Paste transactional SMS here... e.g. Rs.450 spent on Swiggy using HDFC Card."
              rows="3"
              className="theme-input resize-none w-full"
            />
          </div>

          {/* Parse Button */}
          <button
            onClick={handleParse}
            disabled={parsing}
            className="w-full py-2.5 rounded-xl bg-themePrimary text-white shadow-neon-glow hover:bg-themePrimaryHover font-bold text-sm transition-all flex items-center justify-center space-x-2"
          >
            {parsing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>AI Parse Transaction SMS</span>
              </>
            )}
          </button>

          {/* Parsed Live Glow Box */}
          {parsedData && (
            <div className="border border-themePrimary/40 bg-themePrimary/5 rounded-xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center pb-2 border-b border-themeBorder">
                <span className="text-xs font-black text-themePrimary flex items-center space-x-1 uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>AI Extracted Details</span>
                </span>
                <span className="text-[9px] bg-themeBorder text-themeText px-1.5 py-0.5 rounded font-black uppercase">
                  {source}
                </span>
              </div>

              {/* Data list grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] text-themeTextMuted uppercase font-bold">Transaction Title</p>
                  <p className="font-extrabold text-themeText mt-0.5">{parsedData.title}</p>
                </div>
                <div>
                  <p className="text-[10px] text-themeTextMuted uppercase font-bold">Category</p>
                  <p className="font-extrabold text-emerald-400 mt-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded inline-block">
                    {parsedData.category}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-themeTextMuted uppercase font-bold">Amount Extracted</p>
                  <p className="font-black text-themeText mt-0.5 text-sm">Rs. {parsedData.amount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-themeTextMuted uppercase font-bold">Detected Merchant / Bank</p>
                  <p className="font-extrabold text-themeText mt-0.5">
                    {parsedData.merchantName} ({parsedData.bank})
                  </p>
                </div>
              </div>

              {/* Save parsed expense */}
              <button
                onClick={handleSaveTransaction}
                disabled={saving}
                className="w-full mt-2 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-glass"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Record Transaction</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

      </GlassCard>
    </div>
  );
};

export default SMSParserModal;
