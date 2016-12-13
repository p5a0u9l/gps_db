// requirements
const fs = require('fs');
const net = require('net');

// load config file
var cfg = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
ACTION = process.argv[2];

const client = net.createConnection(
        {port: cfg.PORT_NUMBER, host: cfg.SERVER_IP}, () => {
    console.log("connected to " + cfg.SERVER_IP + ":" + cfg.PORT_NUMBER);
    if (ACTION == 'register') {
        console.log('processing new key register');
        send_json({command: "newkey"});
    } else if (ACTION == 'consume') {
        push_records(process.argv[3]);
    } else if (ACTION == 'fetch') {
        fetch_records();
    };
}).setTimeout(1000, () => {client.end()});

client.on('data', (chunk) => {
    let data = '';

    try {
        var obj = JSON.parse(chunk);
        if (obj.newkey) fs.writeFileSync('./.gps_db_client_key', obj.newkey);
        console.log(JSON.stringify(obj, null, 4));
        client.end();
    } catch(err) {
        data += chunk;
    }
}).on('end', () => {
    try {
        var obj = JSON.parse(data);
        if (typeof(obj.result) == 'object') fs.writeFileSync('./gps_db_fetch.json', obj.response);
        console.log('disconnected from server');
    } catch(err) {
    }
});

function fetch_records() {
    obj = {command: "get"};

    // read in the local client key
    if (fs.existsSync(cfg.CLIENT_KEY_FILENAME)) {
        obj.client_key = fs.readFileSync(cfg.CLIENT_KEY_FILENAME).toString();
    } else {
        throw new Error("No client key found... first, issue node gps_client.js register");
    }

    send_json(obj);
}

function push_records(fpath) {
    obj = {command: "put"};

    // read the JSON records into an array
    obj.payload = fs.readFileSync(fpath).utf8Slice();

    // read in the local client key
    if (fs.existsSync(cfg.CLIENT_KEY_FILENAME)) {
        obj.client_key = fs.readFileSync(cfg.CLIENT_KEY_FILENAME).toString();
    } else {
        throw new Error("No client key found... first, issue node gps_client.js register");
    }

    // send record to database
    send_json(obj);
}

function send_json(obj) {
    console.log('sending...');
    client.write(JSON.stringify(obj), () => {
        console.log('send is complete');
    });
}
