// 简单的插件功能测试脚本
const fs = require('fs');
const path = require('path');

console.log('🌟 每日仪式插件测试');
console.log('==================');

// 检查必要文件是否存在
const requiredFiles = [
    'package.json',
    'out/extension.js',
    'src/extension.ts',
    'src/utils/StorageManager.ts',
    'src/providers/CalendarProvider.ts',
    'src/panels/CheckInPanel.ts',
    'src/panels/FortunePanel.ts',
    'resources/icon.svg',
    'README.md'
];

console.log('\n📁 检查文件结构:');
let allFilesExist = true;

requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
});

// 检查 package.json 配置
console.log('\n📦 检查 package.json 配置:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredFields = ['name', 'displayName', 'version', 'engines', 'main', 'contributes'];
    requiredFields.forEach(field => {
        const hasField = packageJson.hasOwnProperty(field);
        console.log(`${hasField ? '✅' : '❌'} ${field}: ${packageJson[field] || 'missing'}`);
    });
    
    // 检查命令配置
    const commands = packageJson.contributes?.commands || [];
    console.log(`✅ 命令数量: ${commands.length}`);
    
    // 检查视图配置
    const views = packageJson.contributes?.views || [];
    console.log(`✅ 视图数量: ${views.length}`);
    
} catch (error) {
    console.log('❌ 无法解析 package.json:', error.message);
}

// 检查编译后的 JavaScript 文件
console.log('\n🔧 检查编译结果:');
try {
    const extensionJs = fs.readFileSync('out/extension.js', 'utf8');
    const hasActivate = extensionJs.includes('activate');
    const hasDeactivate = extensionJs.includes('deactivate');
    
    console.log(`${hasActivate ? '✅' : '❌'} activate 函数`);
    console.log(`${hasDeactivate ? '✅' : '❌'} deactivate 函数`);
    
} catch (error) {
    console.log('❌ 无法读取编译后的文件:', error.message);
}

console.log('\n🎉 测试完成！');
console.log('如果所有检查都通过，插件应该可以正常工作了。');
console.log('\n📋 下一步:');
console.log('1. 在 VSCode 中按 F5 启动调试模式');
console.log('2. 使用命令面板测试插件功能');
console.log('3. 打包插件: vsce package'); 