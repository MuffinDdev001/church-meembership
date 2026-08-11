import React from 'react';

/**
 * Uniform close (X) button used across all forms.
 * Always positioned absolute top-3 right-3 with consistent size.
 */
const CloseButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full focus:outline-none z-50"
    aria-label="Close"
  >
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);

export default CloseButton;
