const fs = require('fs');

const replacements = {
    'text-blue-700': 'text-[var(--color-text-main)]',
    'border-blue-100': 'border-[var(--color-border-dark)]',
    'bg-amber-50': 'bg-amber-500/10',
    'text-amber-700': 'text-amber-500',
    'border-amber-200': 'border-amber-500/30',
    'focus:ring-blue-500': 'focus:ring-[var(--color-brand-orange)] accent-[var(--color-brand-orange)]',
    'text-gray-300': 'text-[var(--color-text-muted)]',
    'hover:border-blue-400': 'hover:border-[var(--color-brand-orange)]',
    'bg-blue-600': 'bg-[var(--color-brand-orange)]',
    'bg-blue-700': 'bg-[var(--color-brand-orange)]',
    'text-[var(--color-brand-orange)]/10 text-blue-700': 'bg-[var(--color-brand-orange)]/10 text-[var(--color-brand-orange)]' // if any
};

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
        content = content.split(key).join(value);
    }
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Fixed final colors!');
