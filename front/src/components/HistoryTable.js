import React from 'react';
import './table.css';

export default ({ history }) => {
  const reverseHistory = history.slice().reverse();
  return (
    <table className="app-table table table-striped">
      <thead>
        <tr>
          <th scope="col">Key</th>
          <th scope="col">Data</th>
        </tr>
      </thead>
      <tbody>
        {reverseHistory.map((data, key) => (
          <tr key={`${key}`}>
            <td>{reverseHistory.length - key}</td>
            <td>{data}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}