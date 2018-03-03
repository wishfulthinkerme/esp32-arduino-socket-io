import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import socket from 'socket.io';
import split from 'lodash/split';
import lowdb from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

const adapter = new FileSync('db.json');
const db = lowdb(adapter);
db.defaults({ devices: [] })
  .write()

global.__basedir = __dirname;

dotenv.load();
const app = express();
const port = process.env.PORT || 5002;

var http = require('http').Server(app);
export const io = require('socket.io')(http);
let count = 0;

const updateCount = (c) => {
  io.sockets.emit('currentCount', c)
}

const emitDevices = () => {

  const devices = db.get('devices')
    .value();
  console.log(devices)
  io.sockets.emit('devices', devices);
}

io.on('connection', function (socket) {
  count++;
  updateCount(count);
  console.log('CurrentConnections', count);
  emitDevices();

  socket.on('toRadio', (data) => {
    console.log('toRadio', data)
    socket.broadcast.emit('toRadio', { 'Rname': data });
  });

  socket.on('radioData', (response) => {
    const data = split(response.data, ':');
    const id = data[0];
    const type = data[1];
    const val = data[2];
    console.log(response.data);
    if (type === 'CHANNEL') {
      const device = db.get('devices')
        .find({ id })
        .value();
      if (!device) {
        db.get('devices')
          .push({ id, channel: val })
          .write()
      }
    }
    if (type === 'TYPE') {
      const device = db.get('devices')
        .find({ id })
        .assign({ type: val })
        .write();
    }
    if (type === 'VALUE') {
      const device = db.get('devices')
        .find({ id })
        .assign({ value: val })
        .write();

    }

    socket.broadcast.emit('fromRadio', response);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected');
    count--;
    updateCount(count);
  });
});

app.use(cors());
app.disable('etag');

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

app.get('/devices', (req, res) => {
  res.send('I am listening!');
});
app.get('/health', (req, res) => {
  res.send('I am listening!');
});

http.listen(port);

console.log('Magic happens at http://localhost:' + port);
