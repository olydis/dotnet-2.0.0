const fs = require("fs");
const memfs =require("../node_modules/memfs");

function addFiles(path, vol) {
    //console.log(path.replace(/^./, ''));
    vol.mkdirSync(path.replace(/^./, ''));
    const files = fs.readdirSync(path);
    const all = [];
  
    for (const file of files) {
        const full = `${path}/${file}`;
        if ( fs.statSync(full).isDirectory()) {
          addFiles(full, vol)
        }
        else {
          const buf =  fs.readFileSync(full);
          vol.writeFileSync(full.replace(/^./, ''), buf);
        }
    }
}

async function main() {
  const vol = memfs.vol;
  addFiles(`./node_modules`,vol);

  // create a json fs
  const json = vol.toJSON();
  const text = JSON.stringify(json) ;
  fs.writeFileSync(`${__dirname}../dist/fs.json`,text);
}


main();