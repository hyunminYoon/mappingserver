var fs = require('fs');
const storage_pmml = './storage_pmml';
const storage_model = './storage_model';

module.exports.init_path=()=>{
    if(!fs.existsSync(storage_pmml)){
        fs.mkdirSync(storage_pmml)
    }
    if(!fs.existsSync(storage_model)){
        fs.mkdirSync(storage_model)
    }
};


exports.storage_pmml_path = storage_pmml+'/';
exports.storage_model_path = storage_model+'/';