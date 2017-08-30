#!/usr/bin/env node

let path = require(require("path").join(__dirname, "package-path.json"));
try { path = require("dotnet-sdk-2.0.0/dist/package-path.json"); } catch(_) { }
require(path);
