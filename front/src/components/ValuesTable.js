import React from 'react';
import map from 'lodash/map';
import './table.css';

export default ({ values }) => (
  <table className="app-table table table-striped">
    <thead>
      <tr>
        <th scope="col">Id</th>
        <th scope="col">Value</th>
      </tr>
    </thead>
    <tbody>
      {map(values, (data, key) => (
        <tr key={`values-${key}`}>
          <td>{data.id}</td>
          <td>{data.val}</td>
        </tr>
      ))}
    </tbody>
  </table>
);