const PRIORITY_MAP = {
    red:    { className: 'priority-badge priority-red',    label: 'Vermelho' },
    orange: { className: 'priority-badge priority-orange', label: 'Laranja'  },
    yellow: { className: 'priority-badge priority-yellow', label: 'Amarelo'  },
    green:  { className: 'priority-badge priority-green',  label: 'Verde'    },
    blue:   { className: 'priority-badge priority-blue',   label: 'Azul'     },
};

export function resolvePriority(triageResult) {
    const p = (
        triageResult?.prioridade ||
        triageResult?.cor ||
        triageResult?.priority ||
        ''
    ).toLowerCase();

    if (p.includes('red') || p.includes('vermelho'))    return { ...PRIORITY_MAP.red };
    if (p.includes('orange') || p.includes('laranja'))  return { ...PRIORITY_MAP.orange };
    if (p.includes('yellow') || p.includes('amarelo'))  return { ...PRIORITY_MAP.yellow };
    if (p.includes('green') || p.includes('verde'))     return { ...PRIORITY_MAP.green };
    if (p.includes('blue') || p.includes('azul'))       return { ...PRIORITY_MAP.blue };

    if (PRIORITY_MAP[p]) return { ...PRIORITY_MAP[p] };

    return {
        className: 'priority-badge priority-unknown',
        label: triageResult?.prioridade || p || 'N/A',
    };
}

export function formatDuration(seconds) {
    if (seconds == null) return '\u2014';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}min ${secs}s`;
}
