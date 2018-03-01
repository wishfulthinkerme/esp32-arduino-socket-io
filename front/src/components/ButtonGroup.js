import React from 'react';
import './button-group.css';

export default ({ onSend }) => (
  <div className="button-group">
    <div className="button-group__btn" onClick={onSend('toRadio', 'R01:LIG:01')}>R01:LIG:01</div>
    <div className="button-group__btn" onClick={onSend('toRadio', 'R01:LIG:00')}>R01:LIG:00</div>
    <div className="button-group__btn" onClick={onSend('toRadio', 'R02:STP:15')}>R02:STP:15</div>
    <div className="button-group__btn" onClick={onSend('toRadio', 'R03:STP:15')}>R03:STP:15</div>
    <div className="button-group__btn" onClick={onSend('toRadio', 'R04:STP:15')}>R04:STP:15</div>
    <div className="button-group__btn" onClick={onSend('toRadio', 'R05:STP:15')}>R05:STP:15</div>
  </div>
);