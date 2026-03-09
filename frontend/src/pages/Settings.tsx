import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import {
    User, ShieldCheck, Settings2,
    Loader2, Check, AlertCircle, LogOut, Lock
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'privacy' | 'account' | 'wallet';

interface UserSettings {
    id: number;
    username: string;
    email: string;
    share_code: string;
    display_name: string | null;
    bio: string | null;
    university: string | null;
    department: string | null;
    note_default_visibility: string;
    show_on_explore: boolean;
    is_profile_public: boolean;
    paps_balance: number;
}

interface Transaction {
    id: number;
    type: string;
    amount: number;
    description: string | null;
    created_at: string;
}



// ── Helper components ───────────────────────────────────────────────────────

const StatusMessage: React.FC<{ msg: string; type: 'success' | 'error' }> = ({ msg, type }) => (
    <div className={`flex items-center gap-2 p-3 border-2 font-mono text-sm ${type === 'success'
        ? 'bg-retro-accent/10 border-retro-accent text-retro-accent'
        : 'bg-retro-danger/10 border-retro-danger text-retro-danger'
        }`}>
        {type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
        {msg}
    </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="text-xs font-bold text-retro-muted tracking-widest uppercase mb-6 pb-2 border-b-2 border-retro-border">
        {children}
    </h2>
);



// ── Main Component ───────────────────────────────────────────────────────────

const Settings: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Wallet State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [iban, setIban] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [walletMsg, setWalletMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [walletLoading, setWalletLoading] = useState(false);



    // Profile form state
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [university, setUniversity] = useState('');
    const [department, setDepartment] = useState('');
    const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // PIN form state
    const [pin, setPin] = useState('');
    const [pinMsg, setPinMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [pinLoading, setPinLoading] = useState(false);

    // Privacy form state
    const [defaultVisibility, setDefaultVisibility] = useState<'private' | 'public'>('private');
    const [showOnExplore, setShowOnExplore] = useState(true);
    const [isProfilePublic, setIsProfilePublic] = useState(true);
    const [privacyMsg, setPrivacyMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [privacyLoading, setPrivacyLoading] = useState(false);

    // Account form state
    const [newEmail, setNewEmail] = useState('');
    const [emailPassword, setEmailPassword] = useState('');
    const [emailMsg, setEmailMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [emailLoading, setEmailLoading] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/api/settings/me');
                const data: UserSettings = res.data;
                setSettings(data);
                setDisplayName(data.display_name || '');
                setBio(data.bio || '');
                setUniversity(data.university || '');
                setDepartment(data.department || '');
                setPin(data.share_code || '');
                setDefaultVisibility((data.note_default_visibility as 'private' | 'public') || 'private');
                setShowOnExplore(data.show_on_explore ?? true);
                setIsProfilePublic(data.is_profile_public ?? true);
            } catch {
                // not logged in or error
            } finally {
                setIsLoading(false);
            }
        };

        const fetchWallet = async () => {
            try {
                const res = await api.get('/api/settings/wallet');
                setTransactions(res.data.transactions);
            } catch {
                // error
            }
        };

        fetchSettings();
        fetchWallet();
    }, []);



    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMsg(null);
        try {
            await api.put('/api/settings/profile', { display_name: displayName, bio, university, department });
            setProfileMsg({ text: 'Profile updated successfully.', type: 'success' });
            setSettings(prev => prev ? { ...prev, display_name: displayName, bio, university, department } : prev);
        } catch (err: any) {
            setProfileMsg({ text: err.response?.data?.detail || 'Update failed.', type: 'error' });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleSavePin = async (e: React.FormEvent) => {
        e.preventDefault();
        setPinLoading(true);
        setPinMsg(null);
        try {
            await api.put('/api/settings/profile/pin', { pin });
            setPinMsg({ text: 'PIN updated successfully.', type: 'success' });
            setSettings(prev => prev ? { ...prev, share_code: pin } : prev);
        } catch (err: any) {
            setPinMsg({ text: err.response?.data?.detail || 'PIN update failed.', type: 'error' });
        } finally {
            setPinLoading(false);
        }
    };

    const handleSavePrivacy = async () => {
        setPrivacyLoading(true);
        setPrivacyMsg(null);
        try {
            await api.put('/api/settings/privacy', {
                note_default_visibility: defaultVisibility,
                show_on_explore: showOnExplore,
                is_profile_public: isProfilePublic
            });
            setPrivacyMsg({ text: 'Privacy settings saved.', type: 'success' });
        } catch (err: any) {
            setPrivacyMsg({ text: err.response?.data?.detail || 'Update failed.', type: 'error' });
        } finally {
            setPrivacyLoading(false);
        }
    };

    const handleChangeEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailLoading(true);
        setEmailMsg(null);
        try {
            await api.put('/api/settings/account/email', { new_email: newEmail, current_password: emailPassword });
            setEmailMsg({ text: 'Email updated. You may need to re-login.', type: 'success' });
            setNewEmail('');
            setEmailPassword('');
        } catch (err: any) {
            setEmailMsg({ text: err.response?.data?.detail || 'Email update failed.', type: 'error' });
        } finally {
            setEmailLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
            return;
        }
        setPasswordLoading(true);
        setPasswordMsg(null);
        try {
            await api.put('/api/settings/account/password', { current_password: currentPassword, new_password: newPassword });
            setPasswordMsg({ text: 'Password updated successfully.', type: 'success' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordMsg({ text: err.response?.data?.detail || 'Password update failed.', type: 'error' });
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleTopup = async (amount: number) => {
        setWalletLoading(true);
        setWalletMsg(null);
        try {
            const res = await api.post('/api/settings/wallet/topup', { amount });
            setSettings(prev => prev ? { ...prev, paps_balance: res.data.balance } : prev);
            setWalletMsg({ text: res.data.message, type: 'success' });
            const txRes = await api.get('/api/settings/wallet');
            setTransactions(txRes.data.transactions);
        } catch (err: any) {
            setWalletMsg({ text: err.response?.data?.detail || 'Topup failed.', type: 'error' });
        } finally {
            setWalletLoading(false);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        setWalletLoading(true);
        setWalletMsg(null);
        try {
            const res = await api.post('/api/settings/wallet/withdraw', { amount: parseInt(withdrawAmount), iban });
            setSettings(prev => prev ? { ...prev, paps_balance: res.data.balance } : prev);
            setWalletMsg({ text: res.data.message, type: 'success' });
            setIban('');
            setWithdrawAmount('');
            const txRes = await api.get('/api/settings/wallet');
            setTransactions(txRes.data.transactions);
        } catch (err: any) {
            setWalletMsg({ text: err.response?.data?.detail || 'Withdrawal failed.', type: 'error' });
        } finally {
            setWalletLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'profile', label: t('set.profile'), icon: <User size={16} /> },
        { id: 'privacy', label: t('set.privacy'), icon: <ShieldCheck size={16} /> },
        { id: 'wallet', label: t('set.wallet'), icon: <span className="font-bold">P</span> },
        { id: 'account', label: t('set.account'), icon: <Settings2 size={16} /> },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-retro-accent" size={32} />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto animate-in fade-in duration-300">
            <div className="mb-8">
                <h1 className="text-4xl font-bold uppercase tracking-tighter">
                    {t('set.title')}<span className="text-retro-accent">_</span>
                </h1>
                {settings && (
                    <p className="text-retro-muted font-mono text-sm mt-1">
                        @{settings.username} · {settings.email}
                    </p>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar */}
                <nav className="md:w-48 flex-shrink-0">
                    <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                        {tabs.map(tab => (
                            <li key={tab.id} className="flex-shrink-0">
                                <button
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold font-mono uppercase tracking-wider transition-all border-2 ${activeTab === tab.id
                                        ? 'bg-retro-accent text-retro-bg border-retro-accent'
                                        : 'border-transparent text-retro-muted hover:text-retro-text hover:border-retro-border'
                                        }`}
                                >
                                    {tab.icon}
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Content */}
                <div className="flex-1 min-w-0">

                    {/* ── Profile Tab ── */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <Card>
                                <SectionTitle>{t('set.public_profile')}</SectionTitle>
                                <form onSubmit={handleSaveProfile} className="space-y-5">
                                    <Input
                                        label={t('set.display_name')}
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                        placeholder={t('set.name_placeholder')}
                                    />
                                    <div className="flex flex-col w-full">
                                        <label className="mb-2 text-sm font-bold text-retro-muted tracking-widest uppercase">{t('set.bio')}</label>
                                        <textarea
                                            className="bg-retro-bg text-retro-text border-2 border-retro-border py-3 px-4 font-mono outline-none focus:border-retro-accent min-h-[100px] resize-y"
                                            value={bio}
                                            onChange={e => setBio(e.target.value)}
                                            placeholder={t('set.bio_placeholder')}
                                            maxLength={280}
                                        />
                                        <span className="text-right text-xs text-retro-muted font-mono mt-1">{bio.length}/280</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input
                                            label={t('set.university')}
                                            value={university}
                                            onChange={e => setUniversity(e.target.value)}
                                            placeholder={t('set.uni_placeholder')}
                                        />
                                        <Input
                                            label={t('set.department')}
                                            value={department}
                                            onChange={e => setDepartment(e.target.value)}
                                            placeholder={t('set.dept_placeholder')}
                                        />
                                    </div>
                                    {profileMsg && <StatusMessage msg={profileMsg.text} type={profileMsg.type} />}
                                    <Button type="submit" disabled={profileLoading} className="w-full sm:w-auto">
                                        {profileLoading ? <><Loader2 size={14} className="animate-spin inline mr-2" />{t('set.saving')}</> : t('set.save_profile')}
                                    </Button>
                                </form>
                            </Card>

                            <Card>
                                <SectionTitle>{t('set.share_pin')}</SectionTitle>
                                <p className="text-retro-muted font-mono text-sm mb-5">
                                    {t('set.pin_desc1')}{' '}
                                    <span className="text-retro-text">/u/{settings?.username}</span>.
                                    {settings?.share_code && (
                                        <span className="ml-2 inline-flex items-center gap-1">
                                            {t('set.current')} <span className="text-retro-accent font-bold tracking-widest">{settings.share_code}</span>
                                        </span>
                                    )}
                                </p>
                                <form onSubmit={handleSavePin} className="flex flex-col sm:flex-row gap-4 items-start">
                                    <div className="w-full sm:w-40">
                                        <Input
                                            label={t('set.new_pin')}
                                            value={pin}
                                            onChange={e => setPin(e.target.value.slice(0, 4).toUpperCase())}
                                            maxLength={4}
                                            placeholder="XXXX"
                                            className="text-center text-2xl tracking-widest font-bold"
                                        />
                                    </div>
                                    <div className="pt-7">
                                        <Button type="submit" disabled={pinLoading || pin.length !== 4}>
                                            {pinLoading ? <Loader2 size={14} className="animate-spin inline mr-2" /> : <Lock size={14} className="inline mr-2" />}
                                            {t('set.set_pin')}
                                        </Button>
                                    </div>
                                </form>
                                {pinMsg && <div className="mt-4"><StatusMessage msg={pinMsg.text} type={pinMsg.type} /></div>}
                            </Card>
                        </div>
                    )}

                    {/* ── Privacy Tab ── */}
                    {activeTab === 'privacy' && (
                        <Card>
                            <SectionTitle>{t('set.privacy_visibility')}</SectionTitle>
                            <div className="space-y-8">
                                <div>
                                    <label className="text-sm font-bold text-retro-muted tracking-widest uppercase block mb-3">
                                        {t('set.default_visibility')}
                                    </label>
                                    <div className="flex gap-3">
                                        {(['private', 'public'] as const).map(v => (
                                            <button
                                                key={v}
                                                onClick={() => setDefaultVisibility(v)}
                                                className={`flex-1 py-4 font-bold font-mono uppercase text-sm border-2 transition-all ${defaultVisibility === v
                                                    ? 'bg-retro-accent text-retro-bg border-retro-accent shadow-solid'
                                                    : 'border-retro-border text-retro-muted hover:border-retro-text hover:text-retro-text'
                                                    }`}
                                            >
                                                {v === 'private' ? t('set.private') : t('set.public')}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-retro-muted font-mono text-xs mt-3">
                                        {defaultVisibility === 'private'
                                            ? t('set.private_desc')
                                            : t('set.public_desc')}
                                    </p>
                                </div>

                                <div className="border-t-2 border-retro-border pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-sm font-bold text-retro-muted tracking-widest uppercase block mb-1">
                                                {t('set.show_explore')}
                                            </label>
                                            <p className="text-retro-muted font-mono text-xs">
                                                {t('set.explore_desc')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowOnExplore(v => !v)}
                                            className={`relative w-14 h-7 border-2 transition-all flex-shrink-0 ${showOnExplore ? 'bg-retro-accent border-retro-accent' : 'bg-retro-bg border-retro-border'
                                                }`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-retro-bg transition-all ${showOnExplore ? 'left-7 bg-retro-bg' : 'left-0.5'
                                                }`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="border-t-2 border-retro-border pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-sm font-bold text-retro-muted tracking-widest uppercase block mb-1">
                                                Profile & Library Visibility
                                            </label>
                                            <p className="text-retro-muted font-mono text-xs">
                                                If disabled, other users cannot see your school information or note library.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsProfilePublic(v => !v)}
                                            className={`relative w-14 h-7 border-2 transition-all flex-shrink-0 ${isProfilePublic ? 'bg-retro-accent border-retro-accent' : 'bg-retro-bg border-retro-border'
                                                }`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-retro-bg transition-all ${isProfilePublic ? 'left-7 bg-retro-bg' : 'left-0.5'
                                                }`} />
                                        </button>
                                    </div>
                                </div>

                                {privacyMsg && <StatusMessage msg={privacyMsg.text} type={privacyMsg.type} />}
                                <Button onClick={handleSavePrivacy} disabled={privacyLoading} className="w-full sm:w-auto">
                                    {privacyLoading ? <><Loader2 size={14} className="animate-spin inline mr-2" />{t('set.saving')}</> : t('set.save_privacy')}
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* ── Wallet Tab ── */}
                    {activeTab === 'wallet' && (
                        <div className="space-y-6">
                            {walletMsg && <StatusMessage msg={walletMsg.text} type={walletMsg.type} />}

                            <div className="bg-retro-accent text-retro-bg p-6 border-4 border-retro-border flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="text-center md:text-left">
                                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">{t('set.available')}</h3>
                                    <div className="text-5xl font-bold font-mono tracking-tighter">
                                        {settings?.paps_balance || 0} <span className="text-2xl opacity-60">PAPS</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Buy PAPS */}
                                <Card>
                                    <SectionTitle>{t('set.buy_paps')}</SectionTitle>
                                    <div className="space-y-4">
                                        {[
                                            { amount: 250, label: t('set.buy_250'), price: t('set.price_250'), desc: t('set.buy_250_desc') },
                                            { amount: 500, label: t('set.buy_500'), price: t('set.price_500'), desc: t('set.buy_500_desc') },
                                            { amount: 1000, label: t('set.buy_1000'), price: t('set.price_1000'), desc: t('set.buy_1000_desc') },
                                        ].map((pkg) => (
                                            <button
                                                key={pkg.amount}
                                                onClick={() => handleTopup(pkg.amount)}
                                                disabled={walletLoading}
                                                className="w-full text-left p-4 border-2 border-retro-border hover:border-retro-accent hover:bg-retro-panel transition-all group flex justify-between items-center"
                                            >
                                                <div>
                                                    <div className="font-bold text-lg">{pkg.label}</div>
                                                    <div className="text-xs font-mono text-retro-muted mt-1">{pkg.desc}</div>
                                                </div>
                                                <div className="bg-retro-accent text-retro-bg px-3 py-1 font-bold text-sm tracking-widest">{pkg.price}</div>
                                            </button>
                                        ))}
                                    </div>
                                </Card>

                                {/* Withdraw */}
                                <Card>
                                    <SectionTitle>{t('set.withdraw')}</SectionTitle>
                                    <p className="text-xs font-mono text-retro-muted mb-4">{t('set.withdraw_desc')}</p>
                                    <form onSubmit={handleWithdraw} className="space-y-4">
                                        <Input
                                            label={t('set.iban')}
                                            value={iban}
                                            onChange={(e) => setIban(e.target.value.toUpperCase())}
                                            placeholder={t('set.iban_placeholder')}
                                            required
                                        />
                                        <Input
                                            label={t('set.amount_to_withdraw')}
                                            type="number"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            placeholder="100"
                                            min="100"
                                            max={settings?.paps_balance || 0}
                                            required
                                        />
                                        <Button type="submit" disabled={walletLoading || !withdrawAmount || parseInt(withdrawAmount) < 100 || parseInt(withdrawAmount) > (settings?.paps_balance || 0)} className="w-full">
                                            {t('set.withdraw_btn')}
                                        </Button>
                                        <p className="text-xs text-retro-danger font-mono text-center">{t('set.withdraw_min')}</p>
                                    </form>
                                </Card>
                            </div>

                            {/* Transaction History */}
                            <Card className="mt-6">
                                <SectionTitle>{t('set.tx_history')}</SectionTitle>
                                {transactions.length === 0 ? (
                                    <div className="text-center text-retro-muted font-mono py-8">{t('set.no_tx')}</div>
                                ) : (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {transactions.map(tx => (
                                            <div key={tx.id} className="flex justify-between items-center p-3 border-b-2 border-retro-border/50 last:border-0 hover:bg-retro-panel transition-colors">
                                                <div>
                                                    <div className="font-bold capitalize">{tx.type}</div>
                                                    <div className="text-xs text-retro-muted font-mono">{new Date(tx.created_at).toLocaleString()}</div>
                                                    {tx.description && <div className="text-xs mt-1 text-retro-text">{tx.description}</div>}
                                                </div>
                                                <div className={`font-bold font-mono ${tx.amount > 0 ? 'text-retro-accent' : (tx.amount < 0 ? 'text-retro-danger' : 'text-retro-text')}`}>
                                                    {tx.amount > 0 ? '+' : ''}{tx.amount} PAPS
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}



                    {/* ── Account Tab ── */}
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <Card>
                                <SectionTitle>{t('set.change_email')}</SectionTitle>
                                <form onSubmit={handleChangeEmail} className="space-y-4">
                                    <div className="text-retro-muted font-mono text-sm mb-2">
                                        {t('set.current')} <span className="text-retro-text">{settings?.email}</span>
                                    </div>
                                    <Input
                                        label={t('set.new_email')}
                                        type="email"
                                        value={newEmail}
                                        onChange={e => setNewEmail(e.target.value)}
                                        required
                                        placeholder="new@email.com"
                                    />
                                    <Input
                                        label={t('set.current_pwd')}
                                        type="password"
                                        value={emailPassword}
                                        onChange={e => setEmailPassword(e.target.value)}
                                        required
                                        placeholder=""
                                    />
                                    {emailMsg && <StatusMessage msg={emailMsg.text} type={emailMsg.type} />}
                                    <Button type="submit" disabled={emailLoading}>
                                        {emailLoading ? <><Loader2 size={14} className="animate-spin inline mr-2" />{t('set.saving')}</> : t('set.update_email')}
                                    </Button>
                                </form>
                            </Card>

                            <Card>
                                <SectionTitle>{t('set.change_pwd')}</SectionTitle>
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <Input
                                        label={t('set.current_pwd')}
                                        type="password"
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                        required
                                        placeholder=""
                                    />
                                    <Input
                                        label={t('set.new_pwd')}
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                        placeholder="Min. 6 characters"
                                    />
                                    <Input
                                        label={t('set.confirm_pwd')}
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="Repeat new password"
                                    />
                                    {passwordMsg && <StatusMessage msg={passwordMsg.text} type={passwordMsg.type} />}
                                    <Button type="submit" disabled={passwordLoading}>
                                        {passwordLoading ? <><Loader2 size={14} className="animate-spin inline mr-2" />{t('set.saving')}</> : t('set.update_pwd')}
                                    </Button>
                                </form>
                            </Card>

                            <Card>
                                <SectionTitle>{t('set.session')}</SectionTitle>
                                <Button variant="danger" onClick={handleLogout} className="flex items-center gap-2">
                                    <LogOut size={16} /> {t('set.logout')}
                                </Button>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
