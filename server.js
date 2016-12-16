const net = require('net');
const crypto = require('crypto');
const fs = require('fs');
const util = require('util');
const gps = require('./gps_db');

let response = {};
var cfg = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

function handle_newkey() {
    console.log("\tACTION: new client")
    const buf = crypto.randomBytes(48);
    response.result = buf.hexSlice();
    gps.new_client(response.result);
    response.print = util.format("A new client entry was created and saved to %s.",
            cfg.CLIENT_KEY_FILENAME);
}

function handle_put(obj) {
    try {
        response.result = gps.new_record(obj);
        response.print = "records inserted into client's table";
        console.log("\tACTION: put --> succeed.");
    } catch(err) {
        response.print = err.message;
        console.log("\tACTION: put --> error --> " + err.message);
        throw err;
    }
}

function handle_get(obj) {
    try {
        response.result = gps.fetch_all(obj);
        response.print = "records retrieved";
        console.log("\tACTION: get --> succeed.");
    } catch(err) {
        response.print = err.message;
        console.log("\tACTION: get --> error." + err.message);
    }
}

function handle_response(obj) {
    gps.open();
    if (obj.command == "newkey") handle_newkey();
    else if (obj.command == "put") handle_put(obj);
    else if (obj.command == "get") handle_get(obj);
}

var server = net.createServer( (sock) => {
    // We have a connection
    remote_address = sock.remoteAddress.replace(/^.*:/, '');
    console.log('\n%s --> CONNECTION from %s: ', Date(), remote_address);

    let data = '';
    response = {};

    sock.on('data', (chunk) => {
        var chunky = chunk.toString();
        try {
            if (chunky.includes('"done"')) {
                if (!chunky.startsWith('{')) {
                    var start_done = chunky.lastIndexOf('{');
                    data += chunky.substring(0, start_done);
                    chunky = chunky.substring(start_done, chunky.length + 1);
                }
            }

            var obj = JSON.parse(chunky); // try to parse chunk

            if (obj.command == 'done') {

                handle_response(JSON.parse(data));

                process.stdout.write('\t\tsending response...');
                sock.write(JSON.stringify(response), () => {
                    console.log('ok'); sock.emit('done');

                });
            } else {
                data += chunk;
            }
        } catch(err) { // assume theres more to buffer
            data += chunk;
        }
    });

    sock.on('done', () => {
        process.stdout.write('\t\tsending done...');
        sock.write(JSON.stringify({command: "done"}), () => {
            console.log('ok');
        });
    });
})
.on('error', (err) => { console.log(err.message); })
.listen(cfg.PORT_NUMBER, cfg.SERVER_IP, () => {
    console.log('Server listening on ' +
            cfg.SERVER_IP + ':' +
            cfg.PORT_NUMBER);
});
