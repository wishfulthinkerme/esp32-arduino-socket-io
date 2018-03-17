import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import socket from 'socket.io';
import split from 'lodash/split';
import lowdb from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import lodash from 'lodash';
import NRF24 from 'nrf';

// RADIO
var openedPipes = {};
const channelHex = (channel) => {
  const reversed = channel.split("").reverse().join("");
  const buf = Buffer.from(reversed);
  return parseInt('0x' + (buf.toString('hex')), 16);
}


// DB
const adapter = new FileSync('db.json');
const db = lowdb(adapter);
db.defaults({ devices: [] })
  .write()

global.__basedir = __dirname;

dotenv.load();
const app = express();
const port = process.env.PORT || 5002;

var http = require('http').Server(app);
const io = require('socket.io')(http);
let count = 0;

const updateCount = (c) => {
  count++;
  io.sockets.emit('currentCount', c)
}

const emitDevices = () => {

  const devices = db.get('devices')
    .value();
  io.sockets.emit('devices', devices);
}


// SETUP RADIO
const spiDev = '/dev/spidev0.0';
const cePin = 17;
const irqPin = 21;
const rxAddr = channelHex('00002');
const txAddr = channelHex('00003');

const radio = NRF24.connect(spiDev, cePin);
radio.channel(0x4c).transmitPower('PA_MAX').dataRate('1Mbps').crcBytes(2);



// radio needs to begin
radio.begin(initApp);

const socketToRadio = (tx) => (data) => {
  const splitData = split(data, ':');
  const bufData = lodash.reverse(Buffer.from(data));
  tx.write(bufData);
}

const initApp = () => {

  const rx = radio.openPipe('rx', rxAddr);
  const tx = radio.openPipe('tx', txAddr);
  let isTxReady = false;
  rx.on('data', (data) => {
    console.log('data', data);
  });
  tx.on('ready', () => {
    isTxReady = true;
  });

  io.on('connection', (socket) => {
    updateCount(count);
    emitDevices();


    socket.on('toRadio', socketToRadio(tx));     // Data from frontend to nrf24l01
    socket.on('disconnect', () => {
      console.log('socket disconnected');
      count--;
      updateCount(count);
    });
  });
};








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
