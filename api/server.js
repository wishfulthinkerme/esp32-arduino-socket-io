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

const emitDevices = () => {
  console.log('devices');
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

const radio = NRF24.connect(spiDev, cePin, irqPin);
radio.channel(0x4c).transmitPower('PA_MAX').dataRate('1Mbps').crcBytes(2);



const socketToRadio = (tx) => (data) => {
  const splitData = split(data, ':');
  const bufData = lodash.reverse(Buffer.from(data));
  tx.write(bufData);
  console.log('radio - tx - ',data);
}


const initSocket = new Promise((resolve, reject) => {
  io.on('connection', (socket) => {
    emitDevices();
    resolve(socket);
  });
})

const initRadio = new Promise((resolve, reject) => {
  radio.begin(() => {
	  
	  radio.printDetails();
    console.log('radio - ready');
    const rx = radio.openPipe('rx', rxAddr);
    const tx = radio.openPipe('tx', txAddr);
    tx.on('ready', () => {
      console.log('radio - tx - ready');
  
      resolve({ rx, tx });
    });
  });
});

const App = Promise.all([initSocket, initRadio]).then((values) => {
  const socket = values[0];
  const radio = values[1];
  console.log('App - ready');


  radio.rx.on('data', (data) => {
	  const newData = data.reverse().toString('utf8');
	 // const newData = data.toString('hex').match(/.{2}/g).reverse().join("");
    console.log('radio - rx - data',newData );
    socket.emit('fromRadio', {data: newData});
  });
  socket.on('toRadio', socketToRadio(radio.tx));     // Data from frontend to nrf24l01
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
