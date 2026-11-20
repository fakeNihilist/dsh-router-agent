import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

await mkdir('lib', { recursive: true });

await build({
  entryPoints: ['src/client/index.jsx'],
  outfile: 'lib/client.body.js',
  bundle: true,
  platform: 'browser',
  format: 'cjs',
  target: ['chrome120'],
  external: ['react', 'react-dom', '@deepseek-ai/*'],
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  logLevel: 'info',
});

const body = await readFile('lib/client.body.js', 'utf8');
const wrapped = `/* dsh-router-agent — generated client bundle. Do not edit. */
window.__ModuleLoader__.load({
  id: 'dsh-router-agent',
  factory: (require) => {
    const module = { exports: {} };
    const exports = module.exports;
    (function (require, module, exports) {
${body}
    })(require, module, exports);
    return module.exports;
  },
});
`;
await writeFile('lib/client.js', wrapped);
console.log('[dsh-router-agent] lib/client.js written');
