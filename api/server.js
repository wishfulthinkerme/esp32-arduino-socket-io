import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import socket from 'socket.io';


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

io.on('connection', function (socket) {
  count++;
  updateCount(count);
  console.log('CurrentConnections', count);
  socket.on('toRadio', (data) => {
    console.log('toRadio', data)
    socket.broadcast.emit('toRadio', { 'Rname': data });
    // io.sockets.emit('toRadio', { 'Rname': data });
  });

  socket.on('radioData', (data) => {
    console.log('radioData', data);
    socket.broadcast.emit('fromRadio', data);
    // io.sockets.emit('fromRadio', data);
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

app.get('/health', (req, res) => {
  res.send('I am listening!');
});

http.listen(port);

console.log('Magic happens at http://localhost:' + port);
