/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

if (typeof require !== "undefined") {

  // FIXME: This tries to work with slimerjs, phantomjs and nodejs. Ideally,
  // we should have a standard commonJS interface.
  // https://github.com/fred-wang/TeXZilla/issues/6

  var main = function (args) {
    // Command line API
    var server = null,
      tex,
      display,
      RTL,
      throwException;

    if (args.length >= 3 && args[1] === "parser") {
      // Parse the string and print the output.
      tex = args[2];
      display = (args.length >= 4 ? args[3] === "true" : false);
      RTL = (args.length >= 5 ? args[4] === "true" : false);
      throwException = (args.length >= 6 ? args[5] === "true" : false);
      try {
        console.log(TeXZilla.toMathMLString(tex, display, RTL, throwException));
      } catch (e) {
        if (typeof process != "undefined") {
          process.exit(1);
        } else if (typeof slimer != "undefined") {
          slimer.exit(1);
        } else if (typeof phantom != "undefined") {
          phantom.exit(1);
        }
      }
    } else if (args.length >= 2 && args[1] === "webserver") {
      // Run a Web server.
      // FIXME: module "webserver" is not available in nodejs.
      try {
        var port = (args.length >= 3 ? parseInt(args[2], 10) : 3141);
        server = require("webserver").create();
        server.listen(port, function (request, response) {
          var query, vars, i, pair, key, value, json, data;
          response.statusCode = 200;
          if (request.method === "GET") {
            // Decode the query string.
            query = request.url.split("?")[1];
            if (query) {
              vars = query.split("&");
              for (i = 0; i < vars.length; i++) {
                pair = vars[i].split("=");
                key = decodeURIComponent(pair[0]).toLowerCase();
                value = decodeURIComponent(pair[1]);
                if (key === "tex") {
                  tex = value;
                } else if (key === "display") {
                  display = (value === "true");
                } else if (key === "rtl") {
                  RTL = (value === "true");
                } else if (key === "exception") {
                  throwException = (value === "true");
                }
              }
            }
          } else if (request.method === "POST") {
            json = JSON.parse(request.post);
            tex = json.tex;
            display = (json.display === "true");
            RTL = (json.rtl === "true");
            throwException = (json.exception === "true");
          }
          if (tex === undefined) {
            response.close();
            return;
          }
          data = { tex: tex };
          try {
            data.mathml = TeXZilla.toMathMLString(tex, display, RTL, throwException);
            data.exception = null;
          } catch (e) {
            data.exception = e.message;
          }
          response.write(JSON.stringify(data));
          response.close();
        });
        console.log("Web server started on http://localhost:" + port);
      } catch (e) {
        console.log(e);
        if (typeof process != "undefined") {
          process.exit(1);
        } else if (typeof slimer != "undefined") {
          slimer.exit(1);
        } else if (typeof phantom != "undefined") {
          phantom.exit(1);
        }
      }
    } else {
      // FIXME: add a stream filter.
      // https://github.com/fred-wang/TeXZilla/issues/7
      console.log("\nUsage:\n");
      console.log("commonjs TeXZilla.js [help]");
      console.log("  Print this help message.\n");
      console.log("commonjs TeXZilla.js parser aTeX [aDisplay] [aRTL] [aThrowExceptionOnError]");
      console.log("  Print TeXZilla.toMathMLString(aTeX, aDisplay, aRTL, aThrowExceptionOnError)");
      console.log("  The interpretation of arguments and the default values are the same.\n");
      console.log("commonjs TeXZilla.js webserver [port]");
      console.log("  Start a Web server on the specified port (default:3141)");
      console.log("  See the TeXZilla wiki for details.\n");
      console.log("cat input | commonjs TeXZilla.js streamfilter > output");
      console.log("  TODO\n");
      console.log("  where commonjs is slimerjs, nodejs or phantomjs.");
    }

    if (server === null) {
      if (typeof process != "undefined") {
        process.exit();
      } else if (typeof slimer != "undefined") {
        slimer.exit();
      } else if (typeof phantom != "undefined") {
        phantom.exit();
      }
    }
  };

  if (typeof exports !== "undefined") {
    exports.setDOMParser = function (aDOMParser) {
      TeXZilla.DOMParser = aDOMParser;
    };

    exports.getTeXSource = function () {
      return TeXZilla.getTeXSource.apply(TeXZilla, arguments);
    };

    exports.toMathMLString = function () {
      return TeXZilla.toMathMLString.apply(TeXZilla, arguments);
    };

    exports.toMathML = function () {
      return TeXZilla.toMathML.apply(TeXZilla, arguments);
    };

    exports.main = main;
  }

  if (typeof exports === "undefined" ||
      (typeof module !== "undefined" && require.main === module)) {
    var args;
    if (typeof process !== "undefined") {
      args = process.argv.slice(1);
    } else {
      args = require("system").args;
    }
    main(args);
  }
}
