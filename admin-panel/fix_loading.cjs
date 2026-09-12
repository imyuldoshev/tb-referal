const fs = require('fs');

function fixLoading(filename) {
    let content = fs.readFileSync(filename, 'utf8');

    // Remove any existing `finally { setIsLoading(false); }` to prevent duplicates
    content = content.replace(/finally\s*\{\s*setIsLoading\(false\);\s*\}/g, '');

    if (filename.includes('Dashboard.jsx')) {
        content = content.replace(/(catch\s*\(err\)\s*\{\s*console\.error\("Xatolik:",\s*err\);\s*\})\s*\};/g, 
        `$1 finally { setIsLoading(false); } };`);
    }
    
    if (filename.includes('Courses.jsx')) {
        content = content.replace(/(catch\s*\(err\)\s*\{\s*console\.error\(err\);\s*\})\s*\};/g, 
        `$1 finally { setIsLoading(false); } };`);
    }

    if (filename.includes('Students.jsx')) {
        content = content.replace(/(catch\s*\(err\)\s*\{\s*console\.error\(err\);\s*\})\s*\};/g, 
        `$1 finally { setIsLoading(false); } };`);
    }
    
    fs.writeFileSync(filename, content, 'utf8');
}

fixLoading('src/pages/Dashboard.jsx');
fixLoading('src/pages/Courses.jsx');
fixLoading('src/pages/Students.jsx');
console.log('Fixed loading logic!');
