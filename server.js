const net = require('net');
const crypto = require('crypto');
const fs = require('fs');

var gps = require('./gps_db');

var cfg = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

function handle_newkey() {
    console.log("\tACTION: new client")
    response = {result: "success"}; // assume the best
    const buf = crypto.randomBytes(48);
    response.newkey = buf.hexSlice();
    gps.new_client(response.newkey);
    response.print = "A new client entry was created. " +
        "Please use the provided key for future transactions.";
    response.result = "success";
    return response;
}

function handle_put(obj) {
    try {
        response.result = gps.new_record(obj);
        response.print = "Records inserted into client's table";
        console.log("\tACTION: put --> succeed.");
    } catch(err) {
        response.print = err.message;
        console.log("\tACTION: put --> error." + err.message);
    }
    return response;
}

function handle_get(obj) {
    try {
        response.result = gps.fetch_all(obj);
        response.print = "Records retrieved";
        console.log("\tACTION: get --> succeed.");
    } catch(err) {
        response.print = err;
        console.log("\tACTION: get --> error." + err.message);
    }
    return response;
}

function handle_response(sock, obj) {
    var responses = {
        newkey: (obj) => { response = handle_newkey(); },

        put: (obj) => { response = handle_put(obj); },

        get: (obj) => { response = handle_get(obj); }
    }

    if (responses[obj.command]) {
        responses[obj.command](obj);
    } else {
        msg = "Unknown command '" + obj.command + "'";
        console.log(msg); response.print = msg;
    }

    sock.write(JSON.stringify(response), () => {
        console.log('response is complete')
    });
}

var server = net.createServer( (sock) => {
    // We have a connection
    remote_address = sock.remoteAddress.replace(/^.*:/, '');
    console.log('%s --> CONNECTION from %s: ', Date(), remote_address);

    let data = '';

    sock.on('data', (chunk) => {
        try {
            var obj = JSON.parse(chunk);
            handle_response(sock, obj);
        } catch(err) {
            data += chunk;
        }
    }).on('end', () => {
        try {
            handle_response(sock, JSON.parse(data));
        } catch(err) {
            console.log(err.message);
        }
    });
});

server.on('error', (err) => { throw err; });

server.listen(cfg.PORT_NUMBER, cfg.SERVER_IP, () => {
    console.log('Server listening on ' +
            cfg.SERVER_IP + ':' +
            cfg.PORT_NUMBER);
});


