// requirements
const readline = require('readline');
const fs = require('fs');
const net = require('net');

// load config file
var cfg = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

// parse inputs
ACTION = process.argv[2];

// function to send json to server
function send_json(obj) {
    var client = new net.Socket();

    client.connect(cfg.PORT_NUMBER, cfg.SERVER_IP, function() {
        client.write(JSON.stringify(obj));
    });

    client.on('data', function(data) {
        obj = JSON.parse(data);
        if (obj.newkey) fs.writeFileSync('./.gps_db_client_key', obj.newkey);
        console.log(JSON.stringify(obj, null, 4));
        client.destroy(); // kill client after server's response
    });
}

// function to consume all the gps records in a file
function consume_geo(fpath) {
    const rl = readline.createInterface({ input: fs.createReadStream(fpath), });
    obj = {};

    if (fs.existsSync(cfg.CLIENT_KEY_FILENAME)) {
        obj.client_key = fs.readFileSync(cfg.CLIENT_KEY_FILENAME).toString();
    } else {
        throw new Error("No client key found... first, issue node gps_client.js register");
    }

    rl.on('line', function (line) {
        try {
            object = JSON.parse(line);
            if (object.class == "TPV" && 'mode' in object && object.mode == 3) {
                obj.command = "put";
                obj.payload = object;
                send_json(obj);
            }
        } catch(err) {
            console.log(err);
        }
    });
}

if (ACTION == 'register') {
    send_json({command: "newkey"});
} else if (ACTION == 'consume') {
    if (process.argv.length >= 3) {
        FPATH = process.argv[3];
    } else {
        throw new Error("Please provide a path to a geojson formatted file");
    }
    consume_geo(FPATH);
}
