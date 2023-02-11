/** @type {import('prettier').Options} */
const config = {
  plugins: [require.resolve('prettier-plugin-packagejson')],
  // Avoid excessive diffs on changes to MDX files
  proseWrap: 'never',
  singleQuote: true,
  trailingComma: 'all',
};

module.exports = config;
