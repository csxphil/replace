var fs = require("fs"),
    path = require("path"),
    colors = require("colors");

var excludes = [],
    includes,
    regex,
    flags = "gm", // global multiline
    canReplace,
    options;

module.exports = function(opts) {
    options = opts;
    regex = options.regex;
    canReplace = !options.dryRun && options.replacement;

    if (options.include) {
        includes = options.include.split(",").map(patternToRegex);
    }
    if (options.exclude) {
        excludes = options.exclude.split(",");
    }
    var list = fs.readFileSync(options.excludeList, "utf-8").split("\n");
    excludes = excludes.concat(list)
        .filter(function(line) {
            return line && line.indexOf("#");
        })
        .map(patternToRegex);
    
    if (!options.silent) {
        var verb = canReplace ? "Replaced" : "Found";
        console.log(verb + " occurences in these files:");
    }

    for (var i = 0; i < options.path.length; i++) {
        if(options.synchronous) {
            replacizeFileSync(options.path[i]);
        }
        else {
            replacizeFile(options.path[i]);         
        }
    }
}

function patternToRegex(pattern) {
    return new RegExp("^" + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').trim() + "$");
}

function includeFile(file) {
    if (includes) {
        for (var i = 0; i < includes.length; i++) {
            if (includes[i].test(file))
                return true;
        }
        return false;      
    }
    else {
        for (var i = 0; i < excludes.length; i++) {
            if (excludes[i].test(file))
                return false;
        }
        return true;
    }
}

function replacizeFile(file) {
  fs.stat(file, function(err, stats) {
      if (err) throw err;

      if (stats.isFile()) {
          if (!includeFile(file)) {
              return;
          }     
          fs.readFile(file, "utf-8", function(err, text) {
              if (err) throw err;

              text = replacizeText(text, file);             
              if(canReplace) {
                  fs.writeFile(file, text, function(err) {
                      if (err) throw err;
                  });
              }
          });
      }
      else if (stats.isDirectory() && options.recursive) {
          fs.readdir(file, function(err, files) {
              if (err) throw err;
              for (var i = 0; i < files.length; i++) {
                  replacizeFile(path.join(file, files[i]));                      
              }
          });
      }
   });
}

function replacizeFileSync(file) {
  var stats = fs.statSync(file);
  if (stats.isFile()) {
      if (!includeFile(file)) {
          return;
      }   
      var text = fs.readFileSync(file, "utf-8");

      text = replacizeText(text, file);
      if (canReplace) {
          fs.writeFileSync(file, text);
      }
  }
  else if (stats.isDirectory() && options.recursive) {
      var files = fs.readdirSync(file);
      for (var i = 0; i < files.length; i++) {
          replacizeFileSync(path.join(file, files[i]));                      
      }
  }
}

function replacizeText(text, file) {
    if (!new RegExp(regex, flags).test(text)) {
        return text;
    }

    if (!options.silent) {
        console.log("\t" + file);
    }
    if (!options.silent && !options.quiet) {
        var lines = text.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (new RegExp(regex, flags).test(line)) {
                var replacement = options.replacement || "$&";
                line = line.replace(new RegExp(regex, flags), replacement[options.color]);
                console.log("\t\t" + (i + 1) + ": " + line);
            }
        }
    }
    if (canReplace) {
        return text.replace(new RegExp(regex, flags), options.replacement);
    }
}