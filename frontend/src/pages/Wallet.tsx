import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Wallet as WalletIcon, Loader2, ArrowUpRight } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface Transaction {
    id: number;
    type: string;
    amount: number;
    description: string | null;
    created_at: string;
}

interface WalletData {
    balance: number;
    transactions: Transaction[];
}

interface EarningsData {
    earned: number;
    spent: number;
    net: number;
    week_start: string;
    week_end: string;
}

const typeColor: Record<string, string> = {
    sale: 'text-retro-accent',
    topup: 'text-retro-accent',
    purchase: 'text-retro-danger',
    fee: 'text-retro-danger',
    refund: 'text-yellow-400',
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="text-xs font-bold text-retro-muted tracking-widest uppercase mb-6 pb-2 border-b-2 border-retro-border">
        {children}
    </h2>
);

const Wallet: React.FC = () => {
    const { t } = useLanguage();
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [walletRes, earningsRes] = await Promise.all([
                    api.get('/api/settings/wallet'),
                    api.get('/api/settings/earnings')
                ]);
                setWalletData(walletRes.data);
                setEarningsData(earningsRes.data);
            } catch (err) {
                console.error("Failed to load wallet data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-retro-accent" size={32} />
            </div>
        );
    }

    const hasZeroBalance = walletData?.balance === 0;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-300">
            <div className="mb-8">
                <h1 className="text-4xl font-bold uppercase tracking-tighter flex items-center gap-3">
                    <WalletIcon size={36} className="text-retro-accent" />
                    {t('set.wallet') || 'WALLET'}<span className="text-retro-accent">_</span>
                </h1>
                <p className="text-retro-muted font-mono text-sm mt-2">
                    Manage your PAPS economy, view earnings, and track transaction history.
                </p>
            </div>

            {hasZeroBalance && (
                <div className="mb-8 p-6 border-2 border-retro-accent bg-retro-accent/10 flex flex-col sm:flex-row gap-6 items-center">
                    <div className="bg-retro-accent text-retro-bg p-4 rounded-full flex-shrink-0">
                        <ArrowUpRight size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold uppercase tracking-widest mb-2 text-retro-accent">How to earn PAPS?</h3>
                        <p className="font-mono text-sm text-retro-muted leading-relaxed">
                            You currently have 0 PAPS. To earn more, start sharing high-quality notes and set a PAPS price.
                            When other students unlock your locked notes, the PAPS go straight to your wallet!
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                    <SectionTitle>{t('set.paps_balance') || 'PAPS Balance'}</SectionTitle>
                    <div className="flex items-end gap-4">
                        <div>
                            <div className="text-retro-muted font-mono text-xs uppercase tracking-wider mb-1">{t('set.available') || 'Available'}</div>
                            <div className="text-6xl font-bold text-retro-accent font-mono">
                                {walletData?.balance ?? 0}
                                <span className="text-2xl ml-2 text-retro-muted">PAPS</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card>
                    <SectionTitle>{t('set.this_week') || 'Earnings This Week'}</SectionTitle>
                    {!earningsData ? (
                        <div className="flex justify-center py-4"><Loader2 className="animate-spin text-retro-accent" size={24} /></div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-retro-bg border-2 border-retro-border p-3">
                                <span className="font-mono text-xs text-retro-muted uppercase">{t('set.earned') || 'Earned'}</span>
                                <span className="font-mono font-bold text-retro-accent">+{earningsData.earned} PAPS</span>
                            </div>
                            <div className="flex justify-between items-center bg-retro-bg border-2 border-retro-border p-3">
                                <span className="font-mono text-xs text-retro-muted uppercase">{t('set.spent') || 'Spent'}</span>
                                <span className="font-mono font-bold text-retro-danger">-{earningsData.spent} PAPS</span>
                            </div>
                            <div className="flex justify-between items-center border-t-2 border-retro-border pt-3 mt-1">
                                <span className="font-mono text-xs font-bold uppercase tracking-widest">{t('set.net') || 'Net'}</span>
                                <span className={`font-mono font-bold text-lg ${earningsData.net >= 0 ? 'text-retro-accent' : 'text-retro-danger'}`}>
                                    {earningsData.net > 0 ? '+' : ''}{earningsData.net} PAPS
                                </span>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            <Card>
                <SectionTitle>{t('set.tx_history') || 'Transaction History'}</SectionTitle>
                {!walletData ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-retro-accent" size={24} /></div>
                ) : walletData.transactions.length === 0 ? (
                    <div className="text-center py-12 text-retro-muted font-mono">
                        <WalletIcon size={40} className="mx-auto mb-4 opacity-30" />
                        <p className="text-sm">{t('set.no_tx') || 'No transactions yet.'}</p>
                    </div>
                ) : (
                    <ul className="divide-y-2 divide-retro-border">
                        {walletData.transactions.map(tx => (
                            <li key={tx.id} className="flex items-center justify-between py-4 gap-4 hover:bg-retro-accent/5 px-2 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-bold font-mono uppercase ${typeColor[tx.type] || 'text-retro-muted'}`}>
                                        {tx.type}
                                    </div>
                                    {tx.description && (
                                        <div className="text-retro-muted font-mono text-xs truncate mt-1">{tx.description}</div>
                                    )}
                                    <div className="text-retro-muted font-mono text-[10px] mt-1">
                                        {new Date(tx.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div className={`font-bold font-mono text-lg flex-shrink-0 ${tx.amount > 0 ? 'text-retro-accent' : 'text-retro-danger'}`}>
                                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} PAPS
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
};

export default Wallet;
