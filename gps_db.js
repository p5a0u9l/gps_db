var sql = require('sqlite3').verbose();
var fs = require('fs');

function gps_db(fname) {
    this.filename = fname;
    this.db = new sql.Database(this.filename);
    if (!fs.exists(this.filename)) { this.init_new_db(); }
}

gps_db.prototype.new_client = function(client_key) {
    q = 'INSERT INTO clients (client_key) VALUES (' + client_key + ')';
    this.db.run(q);
}

gps_db.prototype.id_from_key = function(client_key) {
    q = "SELECT client_id FROM clients WHERE client_key == " + client_key;
    this.db.each(q, function(err, row) {
        this.current_client_id = row.client_id);
    }
    if (this.current_client_id) { return true; }; return false;
}

gps_db.prototype.new_record = function(gps) {
    client_id = this.current_client_id;
    q = 'INSERT INTO gps_records ' +
        '(client_id, zulu_time, lat_deg, lon_deg, alt_m, speed)' +
        'VALUES (' + util.format('%d, %d, %s, %f, %f, %f, %f',
                client_id, gps.time, gps.lat, gps.lon, gps.alt, gps.speed) + ')';
    this.db.run(q);
}

gps_db.prototype.init_new_db = function() {
    q = 'CREATE TABLE IF NOT EXISTS clients' +
            'client_id INTEGER PRIMARY KEY' +
            'client_key TEXT';
    this.db.run(q);

    q = 'CREATE TABLE IF NOT EXISTS gps_records' +
        'record_id INTEGER PRIMARY KEY' +
        'client_id INTEGER' +
        'posix_time INTEGER' +
        'zulu_time TEXT' +
        'lat_deg REAL' +
        'lon_deg REAL' +
        'alt_m REAL' +
        'speed REAL';
    this.db.run(q);
}

module.exports = gps_db;
