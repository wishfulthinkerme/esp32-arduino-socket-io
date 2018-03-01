import React from 'react';
import './card.css';

export default ({ header, children, className }) => (
  <div className={`${className} card`}>
    <h3>{header}</h3>
    {children}
  </div>
);