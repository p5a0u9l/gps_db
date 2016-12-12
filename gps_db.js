const sql = require('sqlite3').verbose();
const fs = require('fs');
const util = require('util');

var cfg = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

db = new sql.Database(cfg.DATABASE_NAME);
if (!fs.exists(cfg.DATABASE_NAME)) { init_new_db(); }

function init_new_db() {
    q = 'CREATE TABLE IF NOT EXISTS clients(' +
            'client_id INTEGER PRIMARY KEY,' +
            ' client_key TEXT);';
    db.run(q);

    q = 'CREATE TABLE IF NOT EXISTS gps_records(' +
            'record_id INTEGER PRIMARY KEY, ' +
            'client_id INTEGER, ' +
            'utc_time TEXT, ' +
            'lat_deg REAL, ' +
            'lon_deg REAL, ' +
            'alt_m REAL, ' +
            'speed REAL);';
    db.run(q);
}

//function to validate geojson looks as expected
function valid_geo(obj) {
    is_valid = false;
    if ("class" in obj &&
            obj.class == "TPV" &&
            "mode" in obj &&
            obj.mode == 3 &&
            "time" in obj &&
            "lat" in obj &&
            "lon" in obj &&
            "alt" in obj &&
            "speed" in obj) {
        is_valid = true;
    }
    return is_valid;
}

function consume(obj, client_id) {
    records = obj.payload.split('\n');

    db.serialize( () => {
        for (var i = 0; i < records.length; i++) {
            try {
                gps = JSON.parse(records[i]);
            } catch(err) {
                continue;
            }
            if (valid_geo(gps)) {
                var q = util.format("INSERT INTO gps_records " +
                    "(client_id, utc_time, lat_deg, lon_deg, alt_m, speed) VALUES " +
                    "(%d, '%s', %d, %d, %d, %d);",
                    client_id, gps.time, gps.lat, gps.lon, gps.alt, gps.speed);
                console.log(q);
                db.run(q);
            }
        }
    });
}

var gps_db = {
    new_client: (client_key) => {
        q = "INSERT INTO clients (client_key) VALUES (?);";
        db.run(q, client_key);
    },

    new_record: (obj) => {
        var q = util.format("SELECT client_id FROM clients WHERE client_key = '%s';",
                obj.client_key);
        db.all(q, (err, row) => {
            if (row[0].client_id) {
                consume(obj, row[0].client_id);
            } else {
                console.log("could not find " + obj.client_key);
            }
        });
    }
}

module.exports = gps_db;
