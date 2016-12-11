var sql = require('sqlite3').verbose();
var fs = require('fs');

function gps_db(fname) {
    this.filename = fname;
    this.db = new sql.Database(this.filename);
    if (!fs.exists(this.filename)) { this.init_new_db(); }
}

gps_db.prototype.new_client = function(client_key) {
    q = 'INSERT INTO clients (client_key) VALUES ("' + client_key + '");';
    this.db.run(q);
}

gps_db.prototype.new_record = function(obj) {
    q = 'SELECT client_id FROM clients WHERE client_key = \'' + obj.client_key + '\';';
    this.db.get(q, function(err, row) {
        if ('client_id' in row) {
            gps = obj.payload;
            q = 'INSERT INTO gps_records ' +
                '(client_id, utc_time, lat_deg, lon_deg, alt_m, speed)' +
                ' VALUES (' + util.format('%d, "%s", %f, %f, %f, %f',
                        row.client_id, gps.time, gps.lat, gps.lon, gps.alt, gps.speed) + ');';
            console.log(q);
            this.db.run(q);
            return true;
        } else {
            return false;
        }
    });
}

gps_db.prototype.init_new_db = function() {
    q = 'CREATE TABLE IF NOT EXISTS clients(' +
            'client_id INTEGER PRIMARY KEY,' +
            ' client_key TEXT);';
    this.db.run(q);

    q = 'CREATE TABLE IF NOT EXISTS gps_records(' +
            'record_id INTEGER PRIMARY KEY, ' +
            'client_id INTEGER, ' +
            'utc_time TEXT, ' +
            'lat_deg REAL, ' +
            'lon_deg REAL, ' +
            'alt_m REAL, ' +
            'speed REAL);';
    this.db.run(q);
}

module.exports = gps_db;
