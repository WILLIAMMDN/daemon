const fs = require('fs');
const content = fs.readFileSync('src/styles.scss', 'utf8');
const lines = content.split(/\r?\n/);

const layout = lines.slice(4, 318).join('\n');
const components = lines.slice(318, 457).join('\n');
const popovers = lines.slice(457, 1040).join('\n');
const gamification = lines.slice(1040).join('\n');

fs.mkdirSync('src/styles', { recursive: true });
fs.writeFileSync('src/styles/_layout.scss', layout);
fs.writeFileSync('src/styles/_components.scss', components);
fs.writeFileSync('src/styles/_popovers.scss', popovers);
fs.writeFileSync('src/styles/_gamification.scss', gamification);

const mainStyles = `@tailwind base;
@tailwind components;
@tailwind utilities;

@import './styles/layout';
@import './styles/components';
@import './styles/popovers';
@import './styles/gamification';

@layer base {
  h1, h2, h3, h4, h5, h6, .font-heading {
    @apply font-heading tracking-tight;
  }
}
`;
fs.writeFileSync('src/styles.scss', mainStyles);
console.log('SCSS dividido con exito.');
