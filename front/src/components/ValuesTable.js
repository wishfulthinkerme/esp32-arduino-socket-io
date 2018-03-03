import React from 'react';
import map from 'lodash/map';
import './table.css';

export default ({ values, onClick }) => (
  <table className="app-table table table-striped">
    <thead>
      <tr>
        <th scope="col">Id</th>
        <th scope="col">Channel</th>
        <th scope="col">Value</th>
        <th scope="col">Action</th>
      </tr>
    </thead>
    <tbody>
      {map(values, (data, key) => (
        <tr key={`values-${key}`}>
          <td>{data.id}</td>
          <td>{data.channel}</td>
          <td>{data.val}</td>
          <td><button type="button" onClick={onClick(data.id, data.channel)}>Beat</button></td>
        </tr>
      ))}
    </tbody>
  </table>
);