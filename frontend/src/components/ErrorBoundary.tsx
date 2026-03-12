import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { AlertTriangle, Home } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-retro-bg text-retro-text flex items-center justify-center p-4">
                    <Card className="max-w-xl w-full border-retro-danger shadow-[4px_4px_0_0_rgba(239,68,68,0.4)]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-retro-danger/20 rounded-full border-2 border-retro-danger">
                                <AlertTriangle className="text-retro-danger" size={32} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold uppercase tracking-tighter text-retro-danger">SYSTEM_CRASH</h1>
                                <p className="text-retro-muted font-mono text-xs uppercase tracking-widest mt-1">Fatal rendering exception</p>
                            </div>
                        </div>

                        <div className="bg-retro-panel border-2 border-retro-border p-4 mb-6 font-mono text-sm overflow-auto max-h-64">
                            <p className="text-retro-danger font-bold mb-2 break-all">
                                {this.state.error?.toString()}
                            </p>
                            <pre className="text-retro-muted text-xs leading-relaxed">
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>

                        <Button onClick={() => window.location.href = '/'} variant="secondary" className="w-full flex items-center justify-center gap-2">
                            <Home size={18} />
                            RETURN_TO_BASE
                        </Button>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
