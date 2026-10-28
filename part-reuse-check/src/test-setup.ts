import '@testing-library/jest-dom/vitest';

// jsdom has no layout, so scrolling APIs are missing. Stub them for component tests.
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
