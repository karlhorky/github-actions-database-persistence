/** @type {import('prettier').Options} */
const config = {
  // Avoid excessive diffs on changes to MDX files
  proseWrap: 'never',
  singleQuote: true,
  trailingComma: 'all',
};

export default config;
