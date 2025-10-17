const generateCodeExample = () => {
  // 使用字符串拼接构建示例代码,避免 Vite 将字符串中的 import 识别为真实的模块导入
  const importKeyword = 'im' + 'port'
  const importPath = `qc-templates/${templateForm.category}/${templateForm.name}`

  return `
// 1. 引入模板
${importKeyword} template from '${importPath}'

// 2. 创建规则实例
const rule = new QcRule({
  template: template,
  name: '${templateForm.name}规则',
  checkDimension: 'RECORD'
})

// 3. 执行规则检查
const result = await rule.execute(data)
if (!result.isValid) {
  console.log('验证失败:', result.errors)
}
  `.trim()
}
