import React from 'react';
import './table.css';

export default ({ history }) => (
  <table className="app-table table table-striped">
    <thead>
      <tr>
        <th scope="col">Key</th>
        <th scope="col">Data</th>
      </tr>
    </thead>
    <tbody>
      {history.map((data, key) => (
        <tr key={`${key}`}>
          <td>{key}</td>
          <td>{data}</td>
        </tr>
      ))}
    </tbody>
  </table>
);