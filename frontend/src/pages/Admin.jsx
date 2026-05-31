import React, { useState, useEffect } from 'react';
import api from '../services/api';
import GlassCard from '../components/GlassCard';
import StatCard from '../components/StatCard';
import { Shield, Users, Database, Landmark, DollarSign, Calendar, RefreshCcw } from 'lucide-react';

const Admin = ({ showToast }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Access Denied: Administrative privileges required', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      
      {/* 1. Global Admin Headers */}
      <div className="flex justify-between items-center pl-1">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-themePrimary" />
          <h3 className="text-sm font-extrabold tracking-wide uppercase text-themeTextMuted">
            Super Administrator Control Terminal
          </h3>
        </div>
        
        <button
          onClick={fetchAdminStats}
          className="p-2.5 rounded-xl border border-themeBorder text-themeTextMuted hover:text-themeText hover:bg-themeBorder transition-all flex items-center space-x-1.5 text-xs font-bold"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Sync Database</span>
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-themePrimary"></div>
        </div>
      ) : stats ? (
        <>
          {/* 2. Database Overview stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Registered Users"
              value={stats.metrics?.totalUsers || 0}
              icon={Users}
              description="System active accounts"
              glowColor="indigo"
            />
            <StatCard
              title="Transactions recorded"
              value={stats.metrics?.totalExpenses || 0}
              icon={Database}
              description="Total database logs"
              glowColor="sky"
            />
            <StatCard
              title="Global transaction volume"
              value={`₹${(stats.metrics?.globalVolume || 0).toLocaleString('en-IN')}`}
              icon={Landmark}
              description="Aggregate system turnover"
              glowColor="emerald"
            />
            <StatCard
              title="Avg transaction cost"
              value={`₹${(stats.metrics?.averageTransaction || 0).toLocaleString('en-IN')}`}
              icon={Landmark}
              description="Mean recorded spent cost"
              glowColor="rose"
            />
          </div>

          {/* 3. Grid for Users list and Global expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Users list (Left column) */}
            <GlassCard className="lg:col-span-1">
              <h4 className="text-xs font-black tracking-wide uppercase text-themeTextMuted mb-4 pb-2 border-b border-themeBorder">
                System Active Accounts ({stats.recentUsers?.length})
              </h4>
              
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {stats.recentUsers?.map((user) => (
                  <div key={user._id} className="flex items-center space-x-3 text-xs">
                    <div className="w-8 h-8 rounded-full bg-themeBorder text-themePrimary flex items-center justify-center font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-themeText truncate leading-tight flex items-center justify-between">
                        <span>{user.name}</span>
                        {user.isAdmin && (
                          <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1 rounded uppercase tracking-widest font-black">
                            Admin
                          </span>
                        )}
                      </p>
                      
                      <p className="text-[10px] text-themeTextMuted truncate mt-0.5">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Global transactions stream (Right columns) */}
            <GlassCard className="lg:col-span-2">
              <h4 className="text-xs font-black tracking-wide uppercase text-themeTextMuted mb-4 pb-2 border-b border-themeBorder">
                Global Transaction Auditing Ledger
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px] select-none">
                  <thead>
                    <tr className="border-b border-themeBorder text-themeTextMuted font-bold uppercase tracking-wider">
                      <th className="pb-3 pl-2">User</th>
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3 text-right pr-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-themeBorder/40">
                    {stats.recentGlobalExpenses?.map((exp) => (
                      <tr key={exp._id} className="hover:bg-themeBorder/10 transition-all font-semibold">
                        <td className="py-2.5 pl-2 font-bold text-themeText leading-tight">
                          <div>
                            <p className="truncate max-w-[80px]">{exp.user?.name || 'Deleted User'}</p>
                            <p className="text-[8px] text-themeTextMuted font-bold truncate max-w-[80px] mt-0.5">{exp.user?.email}</p>
                          </div>
                        </td>
                        <td className="py-2.5 font-bold text-themeText truncate max-w-[120px]">{exp.title}</td>
                        <td className="py-2.5">
                          <span className="bg-themeBorder text-themeText px-1.5 py-0.5 rounded text-[10px]">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-2.5 text-right pr-2 font-black text-rose-500">
                          -₹{exp.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

          </div>
        </>
      ) : (
        <div className="text-center py-20 text-themeTextMuted">
          <Shield className="w-12 h-12 mb-2 text-themeBorder mx-auto animate-pulse" />
          <p className="text-xs font-bold">Failed to load administrator terminal data.</p>
        </div>
      )}

    </div>
  );
};

export default Admin;
