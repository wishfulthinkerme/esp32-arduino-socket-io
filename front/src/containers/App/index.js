import React, { Component } from 'react';
import {
  withRouter
} from 'react-router-dom';
import { compose } from 'redux';
import socketIo from 'socket.io-client';
import split from 'lodash/split';
import filter from 'lodash/filter';
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
    devices: [],
  }

  componentDidMount() {
    this.socket = socketIo('ws://localhost:5002/', {});
    this.socket.on('devices', response => {
      this.setState({
        devices: response,
      })
    });
    this.socket.on('fromRadio', response => {

      this.setState({
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

  sendToDevice = (id, channel, type, val) => () => {
    this.send('toRadio', `${id}:${channel}:${type}:${val}`)();
  }

  render() {
    let { history, values, devices } = this.state;
    return (
      <main className="app">
        <NavHeader />
        <section className="app-content">
          <article className="row">
            <Card header="Devices" className="col-sm-4">
              <ValuesTable values={devices} onClick={this.sendToDevice} />
            </Card>
            <Card header="History" className="col-sm-4">
              <HistoryTable history={history} />
            </Card>
            <Card header="Current count" className="col-sm-4">
              <div className="app-counter">{this.state.currentCount}</div>
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