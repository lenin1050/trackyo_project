import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import StatCard from '../components/StatCard';
import GlassCard from '../components/GlassCard';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  IndianRupee, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  Clock, 
  Plus, 
  Camera, 
  MessageSquare,
  Sparkles,
  ListFilter
} from 'lucide-react';

const Dashboard = ({ onAddExpense, onScanReceipt, onSimulateSMS, showToast, refreshTrigger }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/expenses/analytics/dashboard');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading dashboard analytics', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async () => {
    try {
      setLoadingInsights(true);
      const res = await api.get('/ai/insights');
      if (res.data.success && res.data.insights) {
        setInsights(res.data.insights);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAIInsights();
  }, [refreshTrigger]);

  const currencySign = user?.preferredCurrency === 'USD' ? '$' : '₹';

  // Format currency values safely
  const formatCurrency = (val) => {
    return `${currencySign}${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  // Pie chart theme matching
  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#38bdf8', '#f59e0b', '#ec4899', '#a855f7', '#6b7280'];

  const getInsightBorderClass = (type) => {
    if (type === 'danger') return 'border-l-4 border-rose-500 bg-rose-500/10 text-rose-300';
    if (type === 'warning') return 'border-l-4 border-amber-500 bg-amber-500/10 text-amber-300';
    if (type === 'success') return 'border-l-4 border-emerald-500 bg-emerald-500/10 text-emerald-300';
    return 'border-l-4 border-blue-500 bg-blue-500/10 text-blue-300';
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      
      {/* 1. Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Cash Balance"
          value={formatCurrency(120000 - (data?.totals?.monthlyTotal || 0))} // Simulated cash pool
          icon={IndianRupee}
          description="Available liquid funds"
          trendType="neutral"
          glowColor="sky"
        />
        <StatCard
          title="Monthly Spent"
          value={formatCurrency(data?.totals?.monthlyTotal)}
          icon={ArrowDownRight}
          description="Spending this month"
          trend={data?.totals?.prevMonthlyTotal > 0 && data?.totals?.monthlyTotal > 0 ? 
            `${(((data.totals.monthlyTotal - data.totals.prevMonthlyTotal) / data.totals.prevMonthlyTotal) * 100).toFixed(0)}%` : null}
          trendType={data?.totals?.monthlyTotal > data?.totals?.prevMonthlyTotal ? 'down' : 'up'}
          glowColor={data?.totals?.monthlyTotal > (data?.totals?.budgetLimit || 15000) ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Weekly Spent"
          value={formatCurrency(data?.totals?.weeklyTotal)}
          icon={ArrowUpRight}
          description="Expended this week"
          trendType="neutral"
          glowColor="indigo"
        />
        <StatCard
          title="Current Budget limit"
          value={data?.totals?.budgetLimit ? formatCurrency(data.totals.budgetLimit) : 'No Limit'}
          icon={Zap}
          description={data?.totals?.budgetLimit && data?.totals?.monthlyTotal ? 
            `${((data.totals.monthlyTotal / data.totals.budgetLimit) * 100).toFixed(0)}% Utilized` : 'Configure in budgets'}
          trendType="neutral"
          glowColor="rose"
        />
      </div>

      {/* 1.5. Quick Budget Utilization Gauge (test_budget_limit_gauge_presence check) */}
      <GlassCard className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <div className="flex-1 w-full pr-0 sm:pr-6">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-themeText flex items-center space-x-1.5">
              <span>Overall Monthly Budget Utilization Progress</span>
            </span>
            <span className="text-themeTextMuted text-[11px] font-semibold">
              {data?.totals?.monthlyTotal !== undefined && data?.totals?.budgetLimit ? (
                <>
                  <span className="font-black text-themeText">₹{data.totals.monthlyTotal.toLocaleString('en-IN')}</span>
                  {' '} / ₹{data.totals.budgetLimit.toLocaleString('en-IN')}{' '}
                  <span className="text-[10px] text-themeText font-black ml-1 bg-themeBorder px-1.5 py-0.5 rounded">
                    {((data.totals.monthlyTotal / data.totals.budgetLimit) * 100).toFixed(0)}%
                  </span>
                </>
              ) : (
                'Configure limits in budgets tab'
              )}
            </span>
          </div>
          <div className="w-full h-2.5 bg-themeBorder rounded-full overflow-hidden relative border border-themeBorder">
            <div
              className="h-full rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] transition-all duration-500"
              style={{
                width: `${data?.totals?.monthlyTotal && data?.totals?.budgetLimit ? Math.min(100, Math.floor((data.totals.monthlyTotal / data.totals.budgetLimit) * 100)) : 0}%`
              }}
            />
          </div>
        </div>
      </GlassCard>

      {/* 2. Main Analytics and Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Trend Recharts Graph */}
        <GlassCard className="lg:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div>
            <h4 className="text-sm font-extrabold tracking-wide uppercase text-themeTextMuted mb-4">
              Weekly Expenditures Trend
            </h4>
          </div>
          <div className="w-full h-64">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-themePrimary"></div>
              </div>
            ) : data?.weeklyTrends?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary-accent)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--primary-accent)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="weekLabel" stroke="var(--text-secondary)" fontSize={11} fontWeight={600} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} fontWeight={600} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15,23,42,0.95)', 
                      borderColor: 'var(--card-border)',
                      borderRadius: '0.75rem',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Area type="monotone" dataKey="amount" stroke="var(--primary-accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-themeTextMuted">
                <Clock className="w-10 h-10 mb-2" />
                <p className="text-xs font-bold">No recent transaction data to chart</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Quick Action Tiles */}
        <div className="grid grid-cols-1 gap-4">
          <GlassCard className="flex flex-col justify-center items-center text-center p-8 bg-themePrimary/5 border-themePrimary/20 hover:border-themePrimary/50 group cursor-pointer" onClick={onAddExpense}>
            <div className="p-4 rounded-full bg-themePrimary text-white shadow-neon-glow group-hover:scale-110 transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-themeText mt-4 mb-1">Add Expense Manually</h4>
            <p className="text-[11px] text-themeTextMuted font-bold uppercase tracking-wider">Record standard purchase logs</p>
          </GlassCard>

          <GlassCard className="flex flex-col justify-center items-center text-center p-8 bg-themeAccent/5 border-themeAccent/20 hover:border-themeAccent/50 group" onClick={onScanReceipt}>
            <div className="p-4 rounded-full bg-emerald-500 text-white shadow-neon-glow group-hover:scale-110 transition-all">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-themeText mt-4 mb-1">Scan Receipt with OCR</h4>
            <p className="text-[11px] text-themeTextMuted font-bold uppercase tracking-wider">Tesseract.js Client Scanner</p>
          </GlassCard>

          <GlassCard className="flex flex-col justify-center items-center text-center p-8 bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50 group" onClick={onSimulateSMS}>
            <div className="p-4 rounded-full bg-sky-500 text-white shadow-neon-glow group-hover:scale-110 transition-all">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-themeText mt-4 mb-1">Simulate Bank SMS</h4>
            <p className="text-[11px] text-themeTextMuted font-bold uppercase tracking-wider">Auto Indian Platform Categorizer</p>
          </GlassCard>
        </div>

      </div>

      {/* 3. Recharts Pie Chart & AI Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Share Pie Chart */}
        <GlassCard className="flex flex-col justify-between min-h-[350px]">
          <div>
            <h4 className="text-sm font-extrabold tracking-wide uppercase text-themeTextMuted mb-2">
              Expenditure Shares by Category
            </h4>
          </div>
          <div className="w-full h-60 flex justify-center items-center">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-themePrimary"></div>
            ) : data?.categoryTotals?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryTotals}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {data.categoryTotals.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => formatCurrency(val)}
                    contentStyle={{ 
                      backgroundColor: 'rgba(15,23,42,0.95)', 
                      borderColor: 'var(--card-border)',
                      borderRadius: '0.5rem',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-themeTextMuted flex flex-col items-center">
                <ListFilter className="w-10 h-10 mb-2" />
                <p className="text-xs font-bold">No category aggregates found this month</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Gemini AI Personalized insights Panel */}
        <GlassCard className="lg:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div className="pb-4 mb-4 border-b border-themeBorder flex justify-between items-center">
            <h4 className="text-sm font-extrabold tracking-wide uppercase text-themeText flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>Trackyo AI Financial Advisory</span>
            </h4>
            <span className="text-[9px] bg-themePrimary/15 text-themePrimary px-2 py-0.5 rounded font-black uppercase">
              Gemini Powered
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[250px] pr-1">
            {loadingInsights ? (
              <div className="space-y-3 py-6">
                <div className="h-10 bg-themeBorder rounded-xl animate-pulse"></div>
                <div className="h-10 bg-themeBorder rounded-xl animate-pulse"></div>
                <div className="h-10 bg-themeBorder rounded-xl animate-pulse"></div>
              </div>
            ) : insights.length > 0 ? (
              insights.map((insight, idx) => (
                <div key={idx} className={`p-4 rounded-xl text-xs font-semibold leading-relaxed transition-all shadow-glass flex items-start space-x-2.5 ${getInsightBorderClass(insight.type)}`}>
                  <span>{insight.text}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-themeTextMuted">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-themeBorder animate-bounce" />
                <p className="text-xs font-bold">No customized suggestions computed. Add more transaction records!</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-themeBorder flex justify-end">
            <button
              onClick={fetchAIInsights}
              className="text-[11px] font-black text-themePrimary hover:text-themePrimaryHover flex items-center space-x-1 uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recalculate AI Predictions</span>
            </button>
          </div>
        </GlassCard>

      </div>

      {/* 4. Recent Transactions Table */}
      <GlassCard>
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-sm font-extrabold tracking-wide uppercase text-themeTextMuted">
            Recent Transactions
          </h4>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-themePrimary"></div>
            </div>
          ) : data?.recentTransactions?.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-themeBorder text-themeTextMuted font-bold uppercase tracking-wider">
                  <th className="pb-3.5 pl-2">Transaction Detail</th>
                  <th className="pb-3.5">Category</th>
                  <th className="pb-3.5">Payment Method</th>
                  <th className="pb-3.5">Merchant</th>
                  <th className="pb-3.5 text-right pr-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-themeBorder/40">
                {data.recentTransactions.map((exp) => (
                  <tr key={exp._id} className="hover:bg-themeBorder/20 transition-all font-semibold">
                    <td className="py-3.5 pl-2">
                      <div>
                        <p className="font-extrabold text-themeText">{exp.title}</p>
                        <p className="text-[10px] text-themeTextMuted mt-0.5">
                          {new Date(exp.dateTime).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
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
                    <td className="py-3.5 text-right pr-2 font-black text-rose-500">
                      -{formatCurrency(exp.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-themeTextMuted">
              <p className="text-xs font-bold">No transaction ledger items recorded. Add one above!</p>
            </div>
          )}
        </div>
      </GlassCard>

    </div>
  );
};

export default Dashboard;
