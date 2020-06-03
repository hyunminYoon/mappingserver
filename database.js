var sqlite3 = require('sqlite3').verbose();
// Create Database
var db = new sqlite3.Database('./mapped_database.db',sqlite3.OPEN_READWRITE| sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the mydb database.');
    }
});

// Create Table
/*
fname : file name
created : created Time
cversion : File version info
target : Target Product ex) asmo, fb
fpath : path of file
*/

// POWER
// 1rule
// devcie, component, data, project, serial, vp, sensor, unit
// AC Motor, Power, Line 1 Current RMS, 테스트 AC모터, ADTC01000201, Power, Line1CurrentRMS, A
// AC Motor, Power, Line 1 Voltage RMS, 테스트 AC모터, ADTC01000201, Power,	Line1VoltageRMS, V
// AC Motor, Power, Line 1 power factor, 테스트 AC모터, ADTC01000201, Power, Line1CurrentRMS, %
// AC Motor, Power, Line 2 Current RMS, 테스트 AC모터, ADTC01000201, Power, Line2CurrentRMS, A
// AC Motor, Power, Line 2 Voltage RMS, 테스트 AC모터, ADTC01000201, Power, Line2CurrentRMS, V
// AC Motor, Power, Line 2 power factor, 테스트 AC모터, ADTC01000201, Power, Line2CurrentRMS, %

// 2rule
// devcie, component, data, project, serial, vp, sensor, unit
// AC Motor, Power, Line 3 Current RMS, 테스트 AC모터, ADTC01000202, Power2, Line3CurrentRMS, A
// AC Motor, Power, Line 3 Voltage RMS, 테스트 AC모터, ADTC01000202, Power2, Line3CurrentRMS, V
// AC Motor, Power, Line 3 power factor, 테스트 AC모터, ADTC01000202, Power2, Line3CurrentRMS, %

// sensor_id = data

db.run('CREATE TABLE IF NOT EXISTS MapTable(\
    device TEXT NOT NULL,\
    component INTERGER NOT NULL,\
    data TEXT NOT NULL,\
    project TEXT NOT NULL,\
    serial INTERGER NOT NULL,\
    vp TEXT NOT NULL,\
    sensor TEXT NOT NULL,\
    unit TEXT NOT NULL,\
    created TEXT NOT NULL,\
    PRIMARY KEY(device, component, data)\
    )');
// Table - Model
// db.run('CREATE TABLE IF NOT EXISTS Model(\
//     fname TEXT NOT NULL PRIMARY KEY,\
//     created TEXT,\
//     title TEXT,\
//     fpath TEXT\
//     )');
module.exports.db = db;