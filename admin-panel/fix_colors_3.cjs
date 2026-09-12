const fs = require('fs');

const replacements = {
    'hover:bg-green-50': 'hover:bg-green-500/10',
    'hover:bg-purple-50': 'hover:bg-purple-500/10',
    'hover:bg-red-50': 'hover:bg-red-500/10',
    'hover:bg-gray-900': 'hover:bg-[#1e262c]',
    'hover:bg-blue-50': 'hover:bg-[var(--color-brand-orange)]/10',
    'hover:bg-amber-50': 'hover:bg-amber-500/10'
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
console.log('Fixed hover colors!');
