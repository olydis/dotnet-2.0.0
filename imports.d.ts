declare module 'fs-monkey' {
    function patchRequire(vol:any, unixifyPaths:boolean):any;
    function patchRequire(vol:any):any;
    function patchFs(vol:any,fs:any):any;
    function patchFs(vol:any):any;
  }


  declare module 'unionfs' {
    const ufs:any;
}
declare module 'memfs' {
    const vol:any;
}
  