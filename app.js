const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./localStorage');
const {phoneNumberFormatter} = require('./helpers/formatter');
const {Client,LocalAuth,List,Buttons} = require('whatsapp-web.js');
const express = require('express')
const socket = require('socket.io')
const qrcode = require('qrcode')
const http = require('http')
const axios = require('axios')

const port = process.env.PORT || 2070

const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ],
    executablePath: "/usr/bin/google-chrome-stable",
  },
  authStrategy: new LocalAuth()
});

const app = express()
const server = http.createServer(app)
const io = socket(server)

app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))

app.get('/', (req, res) => {
  var apikey = req.query.apikey;

  if (apikey === '2117102004') {
    res.sendFile('public/index.html', {
      root: __dirname
    })
  } else {
    res.send('403')
  }
})

client.on('message', async msg => {
  const seen = await msg.getChat();
  if (msg.body && !seen.isGroup) {
    let nowa = msg.from.replace('@c.us', '')
    if (await check(nowa) == false) {

      if (msg.body == 'Daftar') {

        if (await daftar(nowa) == true) {
          const btn = new Buttons(
            'bot penghitung pengeluaran\ngunakan dengan baik 😉.',
            [{
                body: 'Pengeluaran'
              },
              {
                body: 'Web'
              }
            ],
            'Bot KR 🤖',
            'menu');

          client.sendMessage(msg.from, 'Berhasil mendaftar 😀.');
          client.sendMessage(msg.from, btn);
        } else {
          client.sendMessage(msg.from, 'Gagal mendaftar 😔.');
        }
      } else {

        const btn = new Buttons(
          'bot penghitung pengeluaran\ngunakan dengan baik 😉.',
          [{
            body: 'Daftar'
          }],
          'Bot KR 🤖',
          'menu');

        client.sendMessage(msg.from, btn);
      }

    } else {
      if (cekjson(nowa, 1)) {

        if (cekjson(nowa, 2)) {

          if (cekno(msg.body)) {

            if (addapi(nowa, msg.body)) {
              client.sendMessage(msg.from, "Berhasil Menambah Pengeluaran 😜.");
              localStorage.removeItem(nowa)
            } else {
              client.sendMessage(msg.from, "Gagal, coba lagi 😱.");
            }

          } else {
            client.sendMessage(msg.from, "Yang betul2 jelah 😡.");
          }

        } else {

          if (cekaswer(msg.body)) {
            updateJson(nowa, msg.body)
            client.sendMessage(msg.from, "oke, Jumlahnya brp? 🤔");
          } else {
            client.sendMessage(msg.from, "Jangan isi selain itu 😡.");
          }
        }


      } else {

        if (msg.body == 'Pengeluaran') {

          // add json
          addData(nowa)

          const productsList = new List(
            "bot penghitung pengeluaran\ngunakan dengan baik 😉.",
            "Pilih",
            [{
              title: "Kategori Pengeluaran",
              rows: [{
                  id: "1",
                  title: "Laundry"
                },
                {
                  id: "2",
                  title: "Bensin"
                },
                {
                  id: "3",
                  title: "Kendaraan"
                },
                {
                  id: "4",
                  title: "Hiburan"
                },
                {
                  id: "5",
                  title: "Makanan"
                },
                {
                  id: "6",
                  title: "Minuman"
                },
                {
                  id: "7",
                  title: "Peralatan"
                },
                {
                  id: "8",
                  title: "Lainya"
                },
              ],
            }, ],
            "Kategori Pengeluaran"
          )

          client.sendMessage(msg.from, productsList)

        } else if (msg.body == 'Web') {
            let url = `bot.labibweb.my.id/${nowa}`;

            client.sendMessage(msg.from, `*Web Anda 📊*\n${url}`)
        } else {

          const btn = new Buttons(
            'bot penghitung pengeluaran\ngunakan dengan baik 😉.',
            [{
                body: 'Pengeluaran'
              },
              {
                body: 'Web'
              }
            ],
            'Bot KR 🤖',
            'menu');

          client.sendMessage(msg.from, btn);
        }

      }

    }
  }
});

client.initialize();

// Socket IO
io.on('connection', function (socket) {
  socket.emit('message', 'Connecting...');

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'QR Code received, scan please!');
    });
  });

  client.on('ready', () => {
    socket.emit('ready', 'Whatsapp is ready!');
    socket.emit('message', 'Whatsapp is ready!');
  });

  client.on('authenticated', () => {
    socket.emit('authenticated', 'Whatsapp is authenticated!');
    socket.emit('message', 'Whatsapp is authenticated!');
    console.log('AUTHENTICATED');
  });

  client.on('auth_failure', function (session) {
    socket.emit('message', 'Auth failure, restarting...');
  });

  client.on('disconnected', (reason) => {
    socket.emit('message', 'Whatsapp is disconnected!');
    client.destroy();
    client.initialize();
  });
});

// Send message api
app.post('/send-message', (req, res) => {
  const number = phoneNumberFormatter(req.body.number);
  const message = req.body.message;
  let apikey = req.query.apikey;

  if (apikey === 'rahasia173') {
    client.sendMessage(number, message).then(response => {
      res.status(200).json({
        status: true,
        response: response
      })
    }).catch(err => {
      res.status(500).json({
        status: false,
        response: err
      })
    })
  } else {
    res.send('403')
  }
})

const check = async (nowa) => {
  return await axios.get(`https://apiwa.labibweb.my.id/api/check?apikey=4dhissf&secure=8shsd&nowa=${nowa}`)
    .then(function (api) {
      return api.data.status
    })
    .catch(function (error) {
      return false
    })
}

const daftar = async (nowa) => {
  return await axios.get(`https://apiwa.labibweb.my.id/api/adduser?apikey=4dhissf&secure=8shsd&nowa=${nowa}`)
    .then(function (api) {
      return api.data.status
    })
    .catch(function (error) {
      return false
    })
}

const addapi = async (nowa, value) => {

  let userJSON = localStorage.getItem(nowa);
  let user = JSON.parse(userJSON);

  value = value.replace('.', '')
  value = value.replace(/k/g, "000");

  return await axios.get(`https://apiwa.labibweb.my.id/api/add?apikey=4dhissf&secure=8shsd&nowa=${nowa}&value=${value}&action=${user.Kategori}`)
    .then(function (api) {
      return api.data.status
    })
    .catch(function (error) {
      return false
    })
}

const addData = (datas) => {
  let newData = {
    "no": datas,
    "Kategori": ""
  }

  let userJSON = JSON.stringify(newData)
  localStorage.setItem(datas, userJSON);
}

const cekjson = (datas, types) => {
  let userJSON = localStorage.getItem(datas)

  switch (types) {
    case 1:

      if (typeof userJSON === "undefined" || userJSON === null) {
        return false
      } else {
        return true
      }
      break;
    case 2:
      let user = JSON.parse(userJSON)

      if (user.Kategori.length === 0) {
        return false
      } else {
        return true
      }
      break;
  }
}

const updateJson = (nowa, datas) => {
  let userJSON = localStorage.getItem(nowa);
  let user = JSON.parse(userJSON);
  let kategori;

  switch (datas) {
    case 'Laundry':
      kategori = 1;
      break;
    case 'Bensin':
      kategori = 2;
      break;
    case 'Kendaraan':
      kategori = 3;
      break;
    case 'Hiburan':
      kategori = 4;
      break;
    case 'Makanan':
      kategori = 5;
      break;
    case 'Minuman':
      kategori = 6;
      break;
    case 'Peralatan':
      kategori = 7;
      break;
    default:
      kategori = 8;
      break;
  }

  let newData = {
    "no": user.no,
    "Kategori": kategori
  }

  const updateUser = JSON.stringify(newData);
  localStorage.setItem(nowa, updateUser);
}

const cekaswer = (text) => {
  if (text === "Laundry" ||
    text === "Bensin" ||
    text === "Kendaraan" ||
    text === "Hiburan" ||
    text === "Makanan" ||
    text === "Minuman" ||
    text === "Peralatan" ||
    text === "Lainya") {

    return true
  } else {
    return false
  }
}

const cekno = (text) => {
  let now = text.replace(/k/g, "000");
      now = now.replace('.', '')

  if (isNaN(now)) {
    return false
  } else {
    return true
  }
}

server.listen(port, function () {
  console.log('App running on :' + port)
})
