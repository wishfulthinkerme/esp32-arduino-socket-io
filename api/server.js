import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import socket from 'socket.io';
import split from 'lodash/split';
import lowdb from 'lodb';
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
  io.sockets.emit('currentCount', c)
}

const emitDevices = () => {

  const devices = db.get('devices')
    .value();
  io.sockets.emit('devices', devices);
}

const spiDev = '/dev/spidev0.0';
const cePin = 17;
const irqPin = 21;
const rxAddr = channelHex('00002');
var radio = NRF24.connect(spiDev, cePin);
radio.channel(0x4c).transmitPower('PA_MAX').dataRate('1Mbps').crcBytes(2);

radio.begin(() => {


  const rx = radio.openPipe('rx', rxAddr);
  rx.on('NEWDATA', (data) => {
    console.log('data', data);
    radio.printDetails();
  });
  io.on('connection', function (socket) {
    count++;
    updateCount(count);
    console.log('CurrentConnections', count);
    emitDevices();


    // Data from frontend to nrf24l01
    socket.on('toRadio', (data) => {
      const splitData = split(data, ':');
      const channel = channelHex(splitData[1]);

      if (!openedPipes[channel]) {
        openedPipes[channel] =  radio.openPipe('tx', channel);
      }

      //radio.printDetails();

      openedPipes[channel].on('ready', () => {
        const bufData = lodash.reverse(Buffer.from(data));
        tx.write(bufData);
        radio.printDetails();
        console.log('toRadioa', data);

      });

    });


    // Receive from radio
    // To be changed for SPI
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
