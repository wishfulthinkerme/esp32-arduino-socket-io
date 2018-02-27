import React, { Component } from 'react';
import {
  withRouter
} from 'react-router-dom';
import { connect } from 'react-redux'
import { bindActionCreators, compose } from 'redux';
import socketIo from 'socket.io-client';
import split from 'lodash/split';
import map from 'lodash/map';

import './styles.css';

class App extends Component {
  socket;
  state = {
    currentCount: 0,
    servo: 0,
    history: [],
    values: {},
    temp: 0.0,
    light: false,
    move: false,
  }

  componentDidMount() {
    this.socket = socketIo('ws://localhost:5002/', {});

    this.socket.on('fromRadio', response => {
      const x = split(response.data, ':');
      const id = x[0];
      const type = x[1];
      const val = x[2];

      if (id === 'R04' && type === 'VAL' && val === 'TRUE') {
        this.send('toRadio', 'R01:LIG:01')();
      }
      if (id === 'R04' && type === 'VAL' && val === 'FALSE') {
        this.send('toRadio', 'R01:LIG:00')();
      }
      this.setState({
        values: {
          ...this.state.values,
          [id]: {
            id, type, val
          }
        },
        history: [...this.state.history, response.data]
      })
    });
    this.socket.on('currentCount', data => {
      this.setState({
        currentCount: data,
      })
    });
  }

  send = (key, data) => () => {
    this.socket.emit(key, data);
    console.log(key, data)
  }

  render() {
    const { history, values } = this.state;
    return (
      <div className="app">
        <h3>History</h3>
        <table className="app__history">
          {map(values, (data, key) => (
            <tr key={`values-${key}`}>
              <td>{data.id}</td>
              <td>{data.val}</td>
            </tr>
          ))}
        </table>
        <div style={{ overflow: 'scroll', height: '300px' }}>
          <table className="app__history">
            {history.map((data, key) => (
              <tr key={`${key}`}>
                <td>{key}</td>
                <td>{data}</td>
              </tr>
            ))}
          </table>
        </div>
        <div>
          <div className="app__button" onClick={this.send('toRadio', 'R01:LIG:01')}>R01:LIG:01</div>
          <div className="app__button" onClick={this.send('toRadio', 'R01:LIG:00')}>R01:LIG:00</div>
          <div className="app__button" onClick={this.send('toRadio', 'R02:STP:15')}>R02:STP:15</div>
          <div className="app__button" onClick={this.send('toRadio', 'R03:STP:15')}>R03:STP:15</div>
          <div className="app__button" onClick={this.send('toRadio', 'R04:STP:15')}>R04:STP:15</div>
          <div className="app__button" onClick={this.send('toRadio', 'R05:STP:15')}>R05:STP:15</div>
        </div>
        <div className="app__count">
          <div className="app__count__label">
            Current count:
          </div>
          <div className="app__count__value">
            {this.state.currentCount}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = () => ({
});

const mapDispatchToProps = dispatch => bindActionCreators({
}, dispatch);

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(App);