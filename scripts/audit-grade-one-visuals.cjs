// Read-only renderer eligibility audit. Input must contain public content only.
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const names = ['visualArithmetic','iconArithmetic','countingVisual','numberSequence','comparisonVisual','shapeVisual','storyVisual','placeValue','numberOrdering','missingAddend'];
const parsers = names.map(name => {
  const filename = path.resolve(__dirname, '../src/components/learning', name + '.ts');
  const compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.paths = module.paths;
  compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, filename);
  return {name,parse:Object.values(compiled.exports)[0]};
});
if (!process.argv[2]) throw new Error('Provide a public-content snapshot JSON with rows and parts arrays.');
const {rows, parts} = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const qualifies = row => !row.question_image_url && !row.image_url && parsers.some(({name,parse}) => (name !== 'numberOrdering' || row.type === 'essay') && parse(row.prompt || ''));
const multipart = rows.filter(row => row.type === 'multipart').map(row => {
  const items = parts.filter(part => part.question_id === row.id);
  return {id:row.id,total:items.length,visual:items.filter(qualifies).length};
});
console.log(JSON.stringify({questions:rows.length,mainVisuals:rows.filter(qualifies).length,parts:parts.length,visualParts:parts.filter(qualifies).length,fullMultipart:multipart.filter(item=>item.total>0&&item.total===item.visual).length,partialMultipart:multipart.filter(item=>item.visual>0&&item.visual<item.total).length,matchingLayoutOnly:rows.filter(row=>row.type==='drag_drop').length,unsupportedMain:rows.filter(row=>!qualifies(row)&&row.type!=='multipart'&&row.type!=='drag_drop').map(row=>({id:row.id,prompt:row.prompt}))},null,2));
