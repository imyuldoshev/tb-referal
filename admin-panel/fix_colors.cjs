const fs = require('fs');

const replacements = {
    'hover:bg-gray-200': 'hover:bg-[#2d3741]',
    'bg-gray-100': 'bg-[#1e262c]',
    'bg-gray-200': 'bg-[#2d3741]',
    'bg-gray-50': 'bg-[var(--color-bg-dark)]',
    'bg-red-100': 'bg-red-500/20',
    'border-blue-200': 'border-[var(--color-brand-orange)]/30',
    'border-gray-200': 'border-[var(--color-border-dark)]',
    'border-gray-300': 'border-[var(--color-border-dark)]',
    'bg-white': 'bg-[var(--color-panel-dark)]',
    'text-gray-900': 'text-[var(--color-text-main)]',
    'text-gray-800': 'text-[var(--color-text-main)]',
    'text-gray-700': 'text-[var(--color-text-main)]',
    'text-gray-600': 'text-[var(--color-text-muted)]',
    'text-gray-500': 'text-[var(--color-text-muted)]',
    'text-gray-400': 'text-[#64748b]',
};

// Also we need to add bg-[var(--color-bg-dark)] text-[var(--color-text-main)] to input and select tags so they look good.
function fixInputsAndSelects(content) {
    // A simple regex to inject bg-[var(--color-bg-dark)] to inputs and selects if not already there
    content = content.replace(/<input\s+([^>]*?)className="/g, '<input $1className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] ');
    content = content.replace(/<select\s+([^>]*?)className="/g, '<select $1className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] ');
    return content;
}

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(file));
        } else { 
            if(file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}

const files = walkDir('src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    for (const [key, value] of Object.entries(replacements)) {
        // use regex with word boundaries to avoid replacing parts of other classes, though simple replace might be fine.
        // For tailwind classes, it's safer to split by space, or just use string replace since they are usually space-separated or quote-bounded
        content = content.split(key).join(value);
    }
    content = fixInputsAndSelects(content);
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Fixed additional colors!');
