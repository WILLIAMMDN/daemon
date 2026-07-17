/* istanbul ignore file */
if (typeof customElements !== 'undefined' && !customElements.get('deep-chat')) {
  customElements.define('deep-chat', class extends HTMLElement {});
}

module.exports = {};
