import React from 'react';
import './button-group.css';

export default ({ onSend }) => (
  <div className="button-group">
    <div className="button-group__btn" onClick={onSend('toRadio', 'R01:LIG:01')}>R01 - Light on</div>
    <div className="button-group__btn" onClick={onSend('toRadio', 'R01:LIG:00')}>R01 - Light off</div>
    <div className="button-group__btn" onClick={onSend('toRadio', 'R02:STP:15')}>R02 - Check Distance</div>
    <div className="button-group__btn" onClick={onSend('toRadio', 'R05:STP:15')}>R05 - Check temp</div>
  </div>
);