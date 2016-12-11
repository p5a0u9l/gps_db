const net = require('net');
const crypto = require('crypto');
const fs = require('fs');

var gps_db = require('./gps_db');
gps = new gps_db('./client_gps.db');

var cfg = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

var validate = function(data) {
    try {
        object = JSON.parse(data);
    } catch(err) {
        console.log('not a json object')
        return false;
    }

    keys = Object.keys(object);

    if (keys.indexOf("command") == -1) {
        console.log('require command key');
        return false;
    }

    return true;
}

function handle(sock) {
    // We have a connection
    remote_address = sock.remoteAddress.replace(/^.*:/, '');
    console.log('%s --> CONNECTION from %s: ', Date(), remote_address);

    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {
        response = {};

        if (validate(data)) {
            obj = JSON.parse(data);
            response.result = "fail"; // assume the best

            var responses = {
                newkey: function(obj) {
                    const buf = crypto.randomBytes(48);
                    response.newkey = buf.hexSlice();
                    gps.new_client(response.newkey);
                    response.print = "A new client entry was created. " +
                                     "Please use the provided key for future transactions.";
                    console.log("\tACTION: new client")
                    response.result = "success";
                },

                put: function(obj) {
                    try {
                        if (gps.new_record(obj)) {
                            response.result = "success";
                            response.print = "Record inserted into client's table";
                            console.log("\tACTION: put --> succeed.");
                        } else {
                            response.print = "Client Id not found in clients table. Have you registered?";
                            console.log("\tACTION: put --> fail.");
                        }
                    } catch(err) {
                        response.print = err;
                        console.log("\tACTION: put --> error.");
                    }
                },

                get: function(obj) {
                    console.log("\tACTION: get");
                }
            }

            if ( responses[obj.command] ) {
                responses[obj.command](obj);

            } else {
                msg = "Unknown command '" + obj.command + "'";
                console.log(msg);
                response.print = msg;
            }

        } else { response.print = "JSON not detected"; }

        sock.write(JSON.stringify(response));
    });
}

var server = net.createServer(handle);

server.listen(cfg.PORT_NUMBER, cfg.SERVER_IP);

console.log('Server listening on ' +
        cfg.SERVER_IP + ':' +
        cfg.PORT_NUMBER);

