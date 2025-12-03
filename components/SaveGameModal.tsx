import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { saveService } from '../services/save';

interface SaveGameModalProps {
    onClose: () => void;
    onSave: (name: string) => Promise<void>;
}

export const SaveGameModal: React.FC<SaveGameModalProps> = ({ onClose, onSave }) => {
    const [saveName, setSaveName] = useState(`Save ${new Date().toLocaleDateString()}`);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!saveName.trim()) {
            setError('Please enter a save name');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await onSave(saveName.trim());
            onClose();
        } catch (err) {
            setError('Failed to save game');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-white font-bold text-lg">
                        <Save className="text-emerald-500" size={24} />
                        <span>Save Game</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Save Name
                        </label>
                        <input
                            type="text"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="Enter save name..."
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-4 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Save</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
