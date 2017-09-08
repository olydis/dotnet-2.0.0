import * as fs from 'fs';
import {dirname} from 'path';

function readBuffer(fd: any, buffer: Buffer, length?: number): Promise<number> {
    return new Promise((r, j) => fs.read(fd, buffer, 0, length || buffer.length, null, (err, bytes) => err ? j(err) : r(bytes)));
  }
  const intBuffer = Buffer.alloc(6);
  function readInt(fd: any): Promise<number> {
    return new Promise((r, j) => fs.read(fd, intBuffer, 0, 6, null, (err, bytes) => err ? j(err) : r(intBuffer.readIntBE(0, 6))));
  }
  
  function addParentPaths(name: string, index: any):any {
    const parent = dirname(name);
    if (parent && !index[parent]) {
      index[parent] = <fs.Stats>{
        size: 0,
        isDirectory: () => true,
        isSymbolicLink: () => false,
        isBlockDevice: () => false,
        isCharacterDevice: () => false,
        isFile: () => false,
        isFIFO: () => false,
        isSocket: () => false,
        dev: 1,
        ino: 1,
        mode: 1,
        nlink: 1,
        uid: 1,
        gid: 1,
        rdev: 1,
  
        blksize: 1,
        blocks: 1,
        atimeMs: 1,
        mtimeMs: 1,
        ctimeMs: 1,
        birthtimeMs: 1,
        atime: new Date(),
        mtime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
      }
      return addParentPaths(parent, index);
    }
    return index;
  }
  interface Index {
    [filepath: string]:fs.Stats;
  }
  export async function staticfs(sourcePath: string): Promise<any> {
    // read the index first
    // 
    const index = <Index>{};
    const fd = fs.openSync(sourcePath, 'r');
    let buf = Buffer.alloc(1024 * 128);
    let dataOffset = await readInt(fd);
  
    do {
      const nameSz = await readInt(fd);
      if (nameSz == 0) {
        break;
      }
      const dataSz = await readInt(fd);
      while (nameSz > buf.length) {
        buf = Buffer.alloc(buf.length * 2);
      }
      await readBuffer(fd, buf, nameSz);
      const name = buf.toString('utf-8', 0, nameSz);

      // add entry for file into index
      index[name] = <fs.Stats>{
        ino: dataOffset,
        size: dataSz,
        isDirectory: () => false,
        isSymbolicLink: () => false,
        isBlockDevice: () => false,
        isCharacterDevice: () => false,
        isFile: () => true,
        isFIFO: () => false,
        isSocket: () => false,
      }
      // ensure parent path has a directory entry
      addParentPaths(name, index);
      dataOffset += dataSz;
    } while (true)
  
    return {
      readFileSync: (filepath: string, options: any): string | Buffer => { 
        const item = index[filepath];
        if (item && item.isFile()) {
          // realloc if necessary
          while (buf.length < item.size) {
            buf = Buffer.alloc(buf.length*2);
          }
  
          // read the content and return a string
          fs.readSync(fd, buf, 0, item.size, item.ino);
          return buf.toString("utf-8", 0, item.size);
        }        
        throw Error(`NO SUCH FILE ${filepath} in static file system.`)
      },
      realpathSync: (filepath: string): string => {
        return filepath;
      },
      statSync: (filepath: string): fs.Stats => {
        return index[filepath] || <fs.Stats>{};
      }
    }
  }
  