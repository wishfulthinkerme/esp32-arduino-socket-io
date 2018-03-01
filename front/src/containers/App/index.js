import React, { Component } from 'react';
import {
  withRouter
} from 'react-router-dom';
import { compose } from 'redux';
import socketIo from 'socket.io-client';
import split from 'lodash/split';

import NavHeader from '../../components/NavHeader';
import ValuesTable from '../../components/ValuesTable';
import HistoryTable from '../../components/HistoryTable';
import ButtonGroup from '../../components/ButtonGroup';
import Card from '../../components/Card';
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
      <main className="app">
        <NavHeader />
        <section className="app-content">
          <article className="row">
            <Card header="Values" className="col-sm-3">
              <ValuesTable values={values} />
            </Card>
            <Card header="History" className="col-sm-3">
              <HistoryTable history={history} />
            </Card>
            <Card header="Current count" className="col-sm-3">
              <div className="app-counter">{this.state.currentCount}</div>
            </Card>
          </article>
          <article className="row pt-sm">
            <Card header="Elements" className="col-sm-4">
              <ButtonGroup onSend={this.send} />
            </Card>
          </article>
        </section>
      </main>

    );
  }
}

export default compose(
  withRouter,
)(App);