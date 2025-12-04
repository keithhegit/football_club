import React, { useState, useEffect } from 'react';
import { Player, Duty } from '../../types';
import { ROLES, RoleDefinition } from '../../data/roles';
import { X, Check } from 'lucide-react';

interface RoleSelectionModalProps {
    player: Player;
    currentRole?: string;
    currentDuty?: Duty;
    onSave: (roleId: string, duty: Duty) => void;
    onClose: () => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
    player,
    currentRole,
    currentDuty,
    onSave,
    onClose
}) => {
    // Filter roles suitable for the player's general position
    // In a real app, we might map specific positions (e.g. DCR) to roles more strictly
    const availableRoles = ROLES.filter(r => r.position === player.position);

    const [selectedRoleId, setSelectedRoleId] = useState<string>(currentRole || availableRoles[0]?.id || '');
    const [selectedDuty, setSelectedDuty] = useState<Duty>(currentDuty || 'Defend');

    const selectedRoleDef = ROLES.find(r => r.id === selectedRoleId);

    // Update duty if the new role doesn't support the current duty
    useEffect(() => {
        if (selectedRoleDef && !selectedRoleDef.availableDuties.includes(selectedDuty)) {
            setSelectedDuty(selectedRoleDef.availableDuties[0]);
        }
    }, [selectedRoleId, selectedRoleDef, selectedDuty]);

    const getAttributeValue = (category: 'technical' | 'mental' | 'physical', attrName: string) => {
        // Need to map the string key to the actual attribute object
        // This assumes the attrName matches the key in the player object exactly
        // We might need a helper if keys differ (e.g. 'rushingOut' vs 'rushing_out')
        // For now, assuming direct match based on previous types
        const attrs = player.attributes[category] as any;
        return attrs[attrName] || 0;
    };

    const renderAttribute = (category: 'technical' | 'mental' | 'physical', attrName: string, isKey: boolean) => {
        const value = getAttributeValue(category, attrName);
        let color = 'text-slate-500';
        if (value >= 16) color = 'text-emerald-400 font-bold';
        else if (value >= 12) color = 'text-green-200';
        else if (value <= 8) color = 'text-red-400';

        return (
            <div key={attrName} className={`flex justify-between items-center text-xs py-0.5 ${isKey ? 'bg-emerald-900/30 -mx-1 px-1 rounded' : ''}`}>
                <span className={`capitalize ${isKey ? 'text-emerald-300 font-bold' : 'text-slate-400'}`}>
                    {attrName.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div className={`w-6 text-right ${color}`}>{value}</div>
            </div>
        );
    };

    return (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="w-full max-w-2xl bg-slate-900 rounded-lg border border-slate-700 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-white">{player.name}</h2>
                        <p className="text-xs text-slate-400">{player.position} - Tactical Role</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden min-h-0">
                    {/* Left: Role List */}
                    <div className="w-1/3 border-r border-slate-700 overflow-y-auto bg-slate-900/50">
                        {availableRoles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => setSelectedRoleId(role.id)}
                                className={`w-full text-left p-3 border-b border-slate-800 hover:bg-slate-800 transition-colors ${selectedRoleId === role.id ? 'bg-emerald-900/20 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div className={`font-bold text-sm ${selectedRoleId === role.id ? 'text-emerald-400' : 'text-slate-300'}`}>{role.name}</div>
                            </button>
                        ))}
                    </div>

                    {/* Right: Details & Attributes */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {selectedRoleDef ? (
                            <div className="space-y-6">

                                {/* Description */}
                                <div>
                                    <h3 className="text-emerald-400 font-bold text-lg mb-1">{selectedRoleDef.name}</h3>
                                    <p className="text-slate-400 text-sm italic">{selectedRoleDef.description}</p>
                                </div>

                                {/* Duty Selector */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Duty</label>
                                    <div className="flex gap-2">
                                        {selectedRoleDef.availableDuties.map(duty => (
                                            <button
                                                key={duty}
                                                onClick={() => setSelectedDuty(duty)}
                                                className={`px-4 py-2 rounded text-sm font-bold border transition-all ${selectedDuty === duty
                                                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg scale-105'
                                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                                                    }`}
                                            >
                                                {duty}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Key Attributes Highlight */}
                                <div className="grid grid-cols-2 gap-6 bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-800 pb-1">Key Technical</h4>
                                        <div className="space-y-1">
                                            {selectedRoleDef.keyAttributes.technical.map(attr => renderAttribute('technical', attr, true))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-800 pb-1">Key Mental</h4>
                                        <div className="space-y-1">
                                            {selectedRoleDef.keyAttributes.mental.map(attr => renderAttribute('mental', attr, true))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-800 pb-1">Key Physical</h4>
                                        <div className="space-y-1">
                                            {selectedRoleDef.keyAttributes.physical.map(attr => renderAttribute('physical', attr, true))}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                Select a role to view details
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 rounded text-slate-300 hover:text-white font-medium">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(selectedRoleId, selectedDuty)}
                        className="px-6 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg"
                    >
                        <Check size={18} />
                        Confirm Changes
                    </button>
                </div>

            </div>
        </div>
    );
};
