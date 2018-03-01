import React from 'react';
import './card.css';

export default ({ header, children, className }) => (
  <div className={`${className} card`}>
    <div className="card__content">
      <h3>{header}</h3>
      {children}
    </div>
  </div>
);