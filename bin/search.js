#!/usr/bin/env node

var nomnom = require("nomnom"),
    replace = require("../replacer"),
    sharedOptions = require("./shared-options");

var options = nomnom.options(sharedOptions)
  .script("search")
  .parse();

replacer(options);
