#!/usr/bin/env node

import * as fs from 'fs';
import {platform, homedir, arch}  from 'os';
import {join, normalize} from 'path';
import {staticfs} from './staticfs'

const patchRequire = require("./fs-monkey/index.js").patchRequire;
/**
 * helper functions
 */

function writePackagePath(packagePath:string, packageFilePath:string)  {
  if(! fs.statSync(packageFilePath).isFile() ){
    throw new Error("Installation failed.");  
  }
  console.log(`Recording package path for platform-specific runtime: ${packagePath}`);
  fs.writeFileSync(join(__dirname, "package-path.json"), JSON.stringify(packagePath));
}

async function install(targetFolder: string, packageName: string,packagePath:string, packageFilePath:string): Promise<void> {
  const mainPath = `yarn/${require("yarn/package.json").bin.yarn}`;
  await new Promise(res => require("mkdirp")(targetFolder, () => res()));
  process.chdir( targetFolder);
  process.argv = [process.argv[0],mainPath,'add',packageName, "--force"]

  // setup our stuff for when it's done.
  process.on("exit", ()=> {
    writePackagePath(packagePath,packageFilePath);
  });

  // run yarn!
  require(mainPath);
}

const fileExists = (path: string | Buffer): Promise<boolean> => new Promise<boolean>((r, j) => fs.stat(path, err => err ? r(false) : r(true)));

function detectArchitecture(): string {
  switch (platform()) {
    case 'darwin':
      return 'osx';
    case 'win32':
      switch (arch()) {
        case 'x64':
          return 'win';
        case 'x86':
          return 'win-x86';
      }
      break;
    case 'linux':
      return `linux`;
  }
  throw new Error(`Unsupported Platform: ${platform()}`);
}

/**
 * app
 */

const dotnetVersion = "2.0.0";
const pathOption = process.env.DOTNET_SHARED_HOME || normalize(`${homedir()}/.net/${dotnetVersion}`);
const archOption = process.env.DOTNET_SHARED_ARCH || detectArchitecture();
const packageName = `dotnet-${dotnetVersion}-${archOption}`;

async function main() {
  // load node_modules from our squish'd fs file.
  patchRequire(await staticfs(`${__dirname}/static.fs`),true);

  const force = process.argv.indexOf("--force") !== -1;
  // derive paths
  const packagePath = join(pathOption, `node_modules/${packageName}/`);
  const packageFilePath = packagePath + "package.json";
  try {
    // force? => remove folder first
    if (force) {
      const rimraf = require('rimraf');
      await new Promise<void>((res, rej) => require(`rimraf`)(packagePath, (err: any) => err ? rej(err) : res()));
    }
    // install
    if (!await fileExists(packageFilePath)) {
      await install(pathOption, packageName,packagePath,packageFilePath);
    } else {
      writePackagePath(packagePath,packageFilePath);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();