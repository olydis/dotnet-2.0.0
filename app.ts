#!/usr/bin/env node

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { fork } from 'child_process';
import * as fsm from 'fs-monkey';
import {vol} from 'memfs';
import {ufs} from 'unionfs';

const f = fs;


console.log ("hi");
vol.fromJSON({'c:\\foo\\bar.js': 'console.log("obi trice");'});
ufs.use(vol);
  //.use(fs);

  fsm.patchFs(vol,fs);
console.log ("There");
console.log(f.readFileSync("/foo/bar.js",'utf8'));

console.log( f ==fs)

require('/foo/bar.js'); // obi trice
console.log ("dude");
const m = `"${__dirname.replace(/\\/g,"/")}/../node_modules/`;
var n = fs.readFileSync("${__dirname}/../yarn/squish.fs.json",'utf8');
//n = n.replace(/"\/node_modules\//g,`${m}`);
//console.log(n);
const node_modules = vol.fromJSON(JSON.parse(n));
//ufs.use(node_modules).use(fs);
//patchRequire(node_modules);

/**
 * helper functions
 */

async function install(targetFolder: string, packageName: string): Promise<void> {
  const npmPath = require.resolve("yarn/package.json");
  const mainPath = require("yarn/package.json").bin.yarn;

  await new Promise(res => require("node_modules/mkdirp")(targetFolder, () => res()));
  const cp = fork(path.join(npmPath, "..", mainPath), ["add", packageName], { cwd: targetFolder });
  return new Promise<void>(res => cp.once("exit", res));
}

const fileExists = (path: string | Buffer): Promise<boolean> => new Promise<boolean>((r, j) => fs.stat(path, err => err ? r(false) : r(true)));

function detectArchitecture(): string {
  switch (os.platform()) {
    case 'darwin':
      return 'osx';
    case 'win32':
      switch (os.arch()) {
        case 'x64':
          return 'win';
        case 'x86':
          return 'win-x86';
      }
      break;
    case 'linux':
      return `linux`;
  }
  throw new Error(`Unsupported Platform: ${os.platform()}`);
}

/**
 * app
 */

const dotnetVersion = "2.0.0";
const pathOption = process.env.DOTNET_SHARED_HOME || path.normalize(`${os.homedir()}/.net/${dotnetVersion}`);
const archOption = process.env.DOTNET_SHARED_ARCH || detectArchitecture();
const packageName = `dotnet-${dotnetVersion}-${archOption}`;

async function main() {
  const force = process.argv.indexOf("--force") !== -1;
  // derive paths
  const packagePath = path.join(pathOption, `node_modules/${packageName}/`);
  const packageFilePath = packagePath + "package.json";
  try {
    // force? => remove folder first
    if (force) {
      await new Promise<void>((res, rej) => require(`/node_modules/rimraf`)(pathOption, (err: any) => err ? rej(err) : res()));
    }
    // install
    if (!await fileExists(packageFilePath)) {
      await install(pathOption, packageName);
    }
    // validate
    if (!await fileExists(packageFilePath)) {
      throw new Error("Installation failed.");
    }
    fs.writeFileSync(path.join(__dirname, "package-path.json"), JSON.stringify(packagePath));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();