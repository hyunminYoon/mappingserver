// import Library
const hostname = '0.0.0.0';
const port = process.env.NODE_PORT || 6027;
const env = process.env;

var async = require('async');
var request = require('request');
var compression = require('compression')
var express = require('express');
var logger = require('morgan');


var db = require('./database').db;
var multer = require("multer");
var fs = require('fs');

var app = express();
app.use(compression())

app.use(logger('common'))


     
// file filter
// function fileFilter (req, file, cb) {
//     // 이 함수는 boolean 값과 함께 `cb`를 호출함으로써 해당 파일을 업로드 할지 여부를 나타낼 수 있습니다.
//     // console.log('fileFilter', req.body)
//     if(req.body.pmml_name == undefined){
//         // cb(null, false)    
//         cb(new Error('pmml_name 이 pmml_file보다 앞에 존재하지 않습니다.'))
//     }else{
//         cb(null, true)
//     }
// }
//const path_file = './files'
var storage = multer.diskStorage({
    destination: function(req, file ,callback){
        // console.log(req.body.pmml_name)
        // if(req.body.pmml_name){
        if(!fs.existsSync('./files/')){
            fs.mkdirSync('./files/')
        }
        //     callback(null, 'files/'+req.body.pmml_name)
        // }else{
        callback(null, 'files/')
        // }
    },
    filename: function(req, file, callback){        
        var extension = path.extname(file.originalname); // 확장자
        var basename = path.basename(file.originalname, extension); //파일명
        // console.log(basename, '_basename')
        callback(null, basename + '-'+Date.now()+extension);  // 파일 명 + 확장자.
    }
});

// 1. 미들웨어 등록
var upload = multer({
    storage: storage,
    // fileFilter:fileFilter
}).single('file');

// router setting
var path = require('path');

// Read CSV file
function readCSV(filePath) {
    var data = fs.readFileSync(filePath, {encoding: "utf8"});
    var rows = data.split(/\r?\n/);
    var result = [];
    var columns = [];
    var devices = [];
    //console.log("data",data);
    //console.log("rows",rows);
    for (var rowIndex in rows) {
        var row = rows[rowIndex].split(",");
        if (rowIndex === "0") { 
            columns = row; 
            // res_columns = row; 
            //console.log("a",columns);
        }else {
            // var data = {}; // 빈 객체를 생성하고 여기에 데이터를 추가한다.
            var data = [];
            console.log("columns",columns)
            for (var columnIndex in columns) { // 칼럼 갯수만큼 돌면서 적절한 데이터 추가하기.
                var column = columns[columnIndex];
                data.push(row[columnIndex]);
                //console.log("a",column);
                if(column == 'device'){
                    devices.push(row[columnIndex]);
                }
                
            }
            // data.push("datetime('now','localtime')")
            result.push(data);
            
        }
    }
    //console.log("b",devices);
    devices = Array.from(new Set(devices));
    console.log("c",devices);

    return {'result':result, 'columns':columns,'devices':devices};
}

// add mapping info
app.post('/api/v1/mapping/file', (req,res)=>{
    upload(req, res, function(err){
        // err by upload
        if(err) return res.status(400).send(err);
        
        //console.log(req);
        // err from not exist file data in body
        if(req.file == undefined) return res.status(400).send("Err- Not existed file")
        var data = readCSV(req.file.path);
        // Check err - not exsited data in file
        if(data.result.length == 0) return res.status(400).send("Err - not exsited data")
        // check Err - not exsited column in file
        if(data.columns.length !== 8) return res.status(400).send("Err - not exsited column")

        // Check header in csv
        let check_err = 0;
        let not_found_column ='';
        for( var col in data.columns){
            if(!(col in ['device', 'component', 'data', 'project', 'serial', 'vp', 'sensor', 'unit'])){
                check_err =1;
                not_found_column = col;
                break;
            }
        }
        
        if(check_err) return res.status(400).send("Err - Not Found Column, "+not_found_column);

        // Making query        
        var select_placeholders = data.devices.map((language) => '(?)').join(',');
        
        // db.all('SELECT * FROM MapTable Where device IN '+select_placeholders, data.devices,(err,rows)=>{
        //     console.log(err)
        //     console.log(rows)
        // })

        // Insert Data into database
        var placeholders = "("+data.columns.map((language) => '?').join(',')+",datetime('now','localtime'))";
        console.log("a", placeholders)
        var sql = 'INSERT INTO MapTable(device, component, data, project, serial, vp, sensor, unit, created) VALUES ' + placeholders;
        var statement = db.prepare(sql);

        // run the query over and over for each inner array
        var count = 0;
        var count_err =0;
        try {
            for (var i = 0; i < data.result.length; i++) {
                statement.run(data.result[i], function (err) { 
                        if (err){                        
                            count_err++;
                            // console.log('err',count_err,i,data.result.length,err)
                            if(data.result.length == count+ count_err){
                                return res.status(400).send(`Finished but, ${count_err} rows can not insert1.`)
                            }
                        } else{
                            count++;
                            if(data.result.length ==count){
                                console.debug("FINISH")
                                return res.status(201).send("Success add info.")
                            }else if(data.result.length == count+ count_err){
                                return res.send(`Finished but, ${count_err} rows can not insert.`)
                            }
                        }
                });
            }            
        } catch (error) {
            console.log(error)
        }
        
            // return res.status(400).send(error)
        statement.finalize();
    })
})

app.get('/api/v1/data/devices', (req,res)=>{
    db.all('SELECT * FROM MapTable', (err, rows)=>{ 

        if(err) return res.status(400).send(err.message)
     
        if(rows){
        var devices=[];            
        var arr1=[];

        rows.forEach(row=> {
            arr1.push(row.device)
        })
        // console.log(arr1)

        function removeDuplicatesArray(arr) {
            var tempArr = [];
            for (var i = 0; i < arr.length; i++) {
                if (tempArr.length == 0) {
                    tempArr.push(arr[i]);
                } else {
                    var duplicatesFlag = true;
                    for (var j = 0; j < tempArr.length; j++) {
                        if (tempArr[j] == arr[i]) {
                            duplicatesFlag = false;
                            break;
                        }
                    }
                    if (duplicatesFlag) {
                        tempArr.push(arr[i]);
                    }
                }
            }
            return tempArr;
        }

        var arr2 = removeDuplicatesArray(arr1);
        
        arr2.forEach(arr=> {
            devices.push({"device_series":arr})
        })
    
        // console.log(removeDuplicatesArray(arr1));
       
        return res.json(devices)

        }
     })
    
 })

// 맵핑 정보확인 API
app.get('/api/v1/data/devices/:device_serial/map', (req,res)=>{
    var serial = req.params.device_serial;
    console.log(serial);
    db.all('SELECT * FROM MapTable WHERE device=?', serial,(err, rows)=>{ 
        if(err) return res.status(400).send(err.message)
        
        if(rows){
            return res.json(rows)
        }else{
            return res.status(404).send("No Data")
        }
        
    })
})

// Get Device Mapping Info 
app.get('/api/v1/data/devices/:device_serial/info', (req,res)=>{
    var serial = req.params.device_serial;
    db.all('SELECT * FROM MapTable WHERE device=?', serial,(err, rows)=>{ 
        if(err) return res.status(400).send(err.message)
        
        if(rows){
            // 전체 데이터 포멧(형식)
            var data = {
                'device_serial':serial,
                'components':[]
            };
            
            // 컴포넌트 객체
           var form_component = {};

            rows.forEach(row=>{
                if(form_component[row.component] === undefined){
                    form_component[row.component] = {
                        "Sensors":[]
                    };
                }
                form_component[row.component].Sensors.push({Sensor_name:row.data, Sensor_id:row.sensor, Unit:row.unit})
            })
            // 컴포넌트 정보를 전체 데이터 포멧에 맞게 변환.
            for( var component in form_component){
                // console.log(component);
                data.components.push({
                    "Component_name":component,
                    "Sensors":form_component[component].Sensors
                })
            }
            
            return res.json(data)}
        }
        
    )
})

// Core server IP Address
const core_server_host ='http://15.165.100.92:5000';

// Data of Device Sensor(component)
app.get('/api/v1/data/devices/:device_serial/data', (req,res)=>{
    var serial = req.params.device_serial;
    // console.log(serial)
    db.all('SELECT * FROM MapTable WHERE device=?', serial,(err, rows)=>{ 
        if(err) return res.status(400).send(err.message)
        console.log("aa",rows)

        if(rows){
            var urls =[];
            var vps = {};
            rows.forEach(row=>{
                
                var url = `/api/data/devices/${row.serial}/data/${row.vp}`
                
                if(vps[row.vp] == undefined) vps[row.vp] = [];
                vps[row.vp].push(row.sensor);
                urls.push(url)
                
                 // console.log("aa",url)
            })
            var urls_set = Array.from(new Set(urls));
            var urls_set2 = Array.from(new Set(urls));
            // console.log("aa",rows)
            
            urls_set = urls_set.map(u=>{
                // console.log("a",req.query.start_time);
                // add Start time 
                if('start_time' in req.query){
                    u +='?start_time='+req.query.start_time;
                }

                // add end time
                if('end_time' in req.query){
                    if('start_time' in req.query){
                        u +='&end_time='+req.query.end_time;
                    }else{
                        u +='?end_time='+req.query.end_time;
                    }
                }

                return u
            })

            // console.log("e",urls_set);
            
            // API 동시 호출(비동기처리)
            async.map(urls_set, getData, function (err, total_response){
                if (err) return console.log(err);
                // console.log("b",total_response[0][0].time);
                // console.log("e",total_response);
                // console.log("c",urls_set2);
               //if('min' in req.query){

                var test_data={};
                urls_set2.forEach((url,j)=>{
                    var target_vp = url.split('/')[6];
                    total_response[j].forEach((d,i)=>{
                    
                        vps[target_vp].forEach((sensor)=>{
                            //  console.log("d",d)
                            //  console.log("i",i)
                           // 객체 초기화
                            if(i == 0){
                                test_data[sensor] = [];
                            }
                            // 객체에 데이터 추가
                            if('sec' in req.query & !('min' in req.query) & !('hour' in req.query)){
                                if (i % req.query.sec == 0){
                                    test_data[sensor].push({
                                    "time":d.time,
                                    "value":d[sensor]
                            })}}
                            
                            else if('min' in req.query & !('sec' in req.query) & !('hour' in req.query)){
                                if (i % (57*req.query.min) == 0){
                                    test_data[sensor].push({
                                    "time":d.time,
                                    "value":d[sensor]
                            })}}

                            else if('hour' in req.query & !('sec' in req.query) & !('min' in req.query)){
                                if (i % (req.query.hour*3375) == 0){
                                    test_data[sensor].push({
                                    "time":d.time,
                                    "value":d[sensor]
                            })}}
                            else{
                                test_data[sensor].push({
                                "time":d.time,
                                "value":d[sensor]
                            })}
                        })
                    })
                })

                /* 데이터 포멧
                    [{
                        “sensor_id”: “센서 아이디1”,
                        “data”: [
                        { “time”: “측정시각”, “value”: “측정값” },…
                        ]
                        },
                    }]
                */
                var data_set = Object.keys(test_data).map(d=>{
                //    console.log(d)
                   return {'sensor_id':d, 'data':test_data[d]};
                })
                //console.log("d",data_set);
                return res.send(data_set)
            });
        }
    })
})

function getData(url, cb){
    // urls.for
    var options = {
        'method': 'GET',
        'url': core_server_host+url,
        'headers': {
        }
    };
    request(options, function (error, response, body) { 
        // if (error) throw new Error(error);
        var data = JSON.parse(body);
        // delete data.device;
        cb(error, data);
        // return res.json(data)
    });
}

// Run Server
app.listen(port,()=>{
    console.log("Running Mapping Server port: "+port);
})