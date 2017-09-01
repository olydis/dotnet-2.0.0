const fs = require("fs");
const memfs =require("../node_modules/memfs");

function addFiles( path, vol ) {
    
    console.log(path.replace(/^./,''));
    vol.mkdirSync(path.replace(/^./,''));

    const files = fs.readdirSync(path);
    for( const file of files ) {
        const full = `${path}/${file}`;
        if( fs.statSync(full).isDirectory())  {

            addFiles(full,vol);
        } else {
            vol.writeFileSync( full.replace(/^./,''), fs.readFileSync(full) );
        }
    }
}

const vol = memfs.vol;



addFiles(`./node_modules`,vol);
const text = JSON.stringify(vol.toJSON()) ;
fs.writeFileSync("./squish.fs.json",text);
