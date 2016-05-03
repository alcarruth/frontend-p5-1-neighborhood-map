// Generated by CoffeeScript 1.10.0

/* Module build-nodes */


/* build-nodes/index.coffee */


/*
 *  ISC License (ISC)
 *  Copyright (c) 2016, Al Carruth <al.carruth@gmail.com>
 * 
 *  Permission to use, copy, modify, and/or distribute this software for
 *  any purpose with or without fee is hereby granted, provided that the
 *  above copyright notice and this permission notice appear in all
 *  copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL
 *  WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
 *  AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR
 *  CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
 *  OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
 *  NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
 *  CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

(function() {
  var Apply, Clean_CSS, CoffeeScript, HTML_Minified_Page, HTML_Page, HTML_Template, JavaScript, QueryURL, SVG, Source, StyleSheet, beautify, beautify_comments, coffee, fs, htmlmin, js_beautify, minify, mustache, render, uglify_js,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  fs = require('fs');

  coffee = require('coffee-script');

  uglify_js = require('uglify-js');

  minify = require('minify');

  Clean_CSS = require('clean-css');

  htmlmin = require('htmlmin');

  mustache = require('mustache');

  js_beautify = require('js-beautify');

  beautify_comments = (function() {
    var re;
    re = new RegExp('\\*/\n+', 'gm');
    return function(s) {
      return s.replace(re, '*/\n');
    };
  })();

  beautify = {
    js: function(x) {
      return beautify_comments(js_beautify(x));
    },
    min_js: function(x) {
      return x;
    },
    css: js_beautify.css,
    min_css: function(x) {
      return x;
    },
    html: js_beautify.html,
    coffee: function(x) {
      return x;
    },
    svg: function(x) {
      return x;
    }
  };

  minify = {
    js: function(s) {
      return uglify_js.minify(s, {
        fromString: true
      }).code;
    },
    min_js: function(x) {
      return x;
    },
    css: function(s) {
      return (new Clean_CSS()).minify(s).styles;
    },
    html: htmlmin,
    coffee: function(x) {
      return x;
    },
    svg: function(x) {
      return x;
    }
  };


  /* Simple object render */


  /**
   * Object render is used to render the html for a resource,
   * either by reference or by inclusion.
   * Example usage:
   *  - render.js.ref('js/jquery.js')
   *  - render.css.inline(css_str)
   */

  render = {
    js: {
      ref: function(path) {
        return '<script src="' + path + '"> </script>\n';
      },
      inline: function(str) {
        return '<script>\n' + str + '\n</script>\n';
      }
    },
    min_js: {
      ref: function(path) {
        return '<script src="' + path + '"> </script>\n';
      },
      inline: function(str) {
        return '<script>\n' + str + '\n</script>\n';
      }
    },
    coffee: {
      ref: function(path) {
        return '<script src="' + path + '" type="text/coffeescript"> </script>\n';
      },
      inline: function(str) {
        return '<script type="text/coffeescript">\n' + str + '\n</script>\n';
      }
    },
    css: {
      ref: function(path) {
        return '<link rel="stylesheet" href="' + path + '">\n';
      },
      inline: function(str) {
        return '<style>\n' + str + '\n</style>\n';
      }
    },
    min_css: {
      ref: function(path) {
        return '<link rel="stylesheet" href="' + path + '">\n';
      },
      inline: function(str) {
        return '<style>\n' + str + '\n</style>\n';
      }
    },
    svg: {
      ref: function(path) {
        return '<img src="' + path + '" alt="' + path + '">\n';
      },
      inline: function(str) {
        return str;
      }
    }
  };


  /* Class Source */


  /**
   * A Source node is a caching node which reads a file to supply its data.
   * @constructor
   * @param {string} name - the file's base name
   * @param {string} dir - the file's directory
   * @param {string} ext - the file's extension
   * @param {string} rtype - render type
   * @method {function} get - return value
   * @method {function} path - return file path
   * @method {function} fill - fetch the value
   * @method {function} ref - return html reference
   * @method {function} inline - return inline html
   * @method {function} make - make the target
   */

  Source = (function() {

    /* constructor() */
    function Source(name, dir, ext, rtype) {
      this.name = name;
      this.dir = dir;
      this.ext = ext;
      this.rtype = rtype;
      this.make = bind(this.make, this);
      this.inline = bind(this.inline, this);
      this.ref = bind(this.ref, this);
      this.fill = bind(this.fill, this);
      this.path = bind(this.path, this);
      this.get = bind(this.get, this);
      this.x = void 0;
      this.rtype = this.rtype || this.ext;
      this.render = render[this.rtype];
    }


    /* method get() */

    Source.prototype.get = function() {
      if (this.x === void 0) {
        this.fill();
      }
      return this.x;
    };


    /* method path() */

    Source.prototype.path = function() {
      return [this.dir, '/', this.name, '.', this.ext].join('');
    };


    /* method fill() */

    Source.prototype.fill = function() {
      return this.x = fs.readFileSync('src/' + this.path(), 'utf-8');
    };


    /* method ref() */

    Source.prototype.ref = function() {
      return this.render.ref(this.path());
    };


    /* method inline() */

    Source.prototype.inline = function() {
      return this.render.inline(this.get());
    };


    /* method make() */

    Source.prototype.make = function(dest) {
      var path;
      path = dest + '/' + this.path();
      console.log(this.path());
      return fs.writeFileSync(path, beautify[this.rtype](this.get()));
    };

    return Source;

  })();


  /* Class Apply */


  /**
   * An Apply node is a caching node which depends on an input node
   * and applies a function fun() to produce its data.
   * @constructor
   * @param {string} name - the node's base name
   * @param {function} fun - the function to apply to the input
   * @param {string} input - an input node
   * @param {string} dir - the file's directory
   * @param {string} ext - the file's extension
   * @param {string} rtype - render type
   * @method {function} get - return value
   * @method {function} path - return file path
   * @method {function} fill - fetch the value
   * @method {function} ref - return html reference
   * @method {function} inline - return inline html
   * @method {function} make - make the target
   */

  Apply = (function() {

    /* constructor() */
    function Apply(name, fun, input, dir, ext, rtype) {
      this.name = name;
      this.fun = fun;
      this.input = input;
      this.dir = dir;
      this.ext = ext;
      this.rtype = rtype;
      this.make = bind(this.make, this);
      this.inline = bind(this.inline, this);
      this.ref = bind(this.ref, this);
      this.fill = bind(this.fill, this);
      this.path = bind(this.path, this);
      this.get = bind(this.get, this);
      this.x = void 0;
      this.rtype = this.rtype || this.ext;
      this.render = render[this.rtype];
    }


    /* method get() */

    Apply.prototype.get = function() {
      if (this.x === void 0) {
        this.fill();
      }
      return this.x;
    };


    /* method path() */

    Apply.prototype.path = function() {
      return [this.dir, '/', this.name, '.', this.ext].join('');
    };


    /* method fill() */

    Apply.prototype.fill = function() {
      return this.x = this.fun(this.input.get());
    };


    /* method ref() */

    Apply.prototype.ref = function() {
      return this.render.ref(this.path());
    };


    /* method inline() */

    Apply.prototype.inline = function() {
      return this.render.inline(this.get());
    };


    /* method make() */

    Apply.prototype.make = function(dest) {
      var path;
      path = dest + '/' + this.path();
      console.log(this.path());
      return fs.writeFileSync(path, beautify[this.rtype](this.get()));
    };

    return Apply;

  })();


  /* Class CoffeeScript */


  /**
   * A CoffeeScript instance contains three caching nodes:
   * one for coffee, one for js and one for minified js.
   * @constructor
   * @param {string} name - the node's base name
   * @param {string} dir - the file's directory
   * @method {function} make - make all three targets
   */

  CoffeeScript = (function() {

    /* constructor() */
    function CoffeeScript(name, dir) {
      this.name = name;
      this.dir = dir;
      this.make = bind(this.make, this);
      this.compile = bind(this.compile, this);
      this.coffee = new Source(this.name, this.dir, 'coffee');
      this.js = new Apply(this.name, this.compile, this.coffee, this.dir, 'js');
      this.js_min = new Apply(this.name, minify.js, this.js, this.dir, 'min.js', 'min_js');
    }


    /* method compile() */

    CoffeeScript.prototype.compile = function(src) {
      return coffee.compile(src);
    };


    /* method make() */

    CoffeeScript.prototype.make = function(dest) {
      if (dest == null) {
        dest = 'dist/';
      }
      this.coffee.make(dest);
      this.js.make(dest);
      return this.js_min.make(dest);
    };

    return CoffeeScript;

  })();


  /* Class JavaScript */


  /**
   * A JavaScript instance contains two caching nodes:
   * one for js and one for minified js.
   * @constructor
   * @param {string} name - the node's base name
   * @param {string} dir - the file's directory
   * @method {function} make - make both targets
   */

  JavaScript = (function() {

    /* constructor() */
    function JavaScript(name, dir) {
      this.name = name;
      this.dir = dir;
      this.make = bind(this.make, this);
      this.js = new Source(this.name, this.dir, 'js', 'min_js');
    }


    /* method make() */

    JavaScript.prototype.make = function(dest) {
      if (dest == null) {
        dest = 'dist/';
      }
      return this.js.make(dest);
    };

    return JavaScript;

  })();


  /* Class StyleSheet */


  /**
   * A StyleSheet instance contains two caching nodes:
   * one for css and one for minified css.
   * @constructor
   * @param {string} name - the node's base name
   * @param {string} dir - the file's directory
   * @method {function} make - make both targets
   */

  StyleSheet = (function() {

    /* constructor() */
    function StyleSheet(name, dir) {
      this.name = name;
      this.dir = dir;
      this.make = bind(this.make, this);
      this.css = new Source(this.name, this.dir, 'css');
      this.css_min = new Apply(this.name, minify.css, this.css, this.dir, 'min.css', 'min_css');
    }


    /* method make() */

    StyleSheet.prototype.make = function(dest) {
      if (dest == null) {
        dest = 'dist/';
      }
      this.css.make(dest);
      return this.css_min.make(dest);
    };

    return StyleSheet;

  })();


  /* Class SVG */


  /**
   * An SVG instance is a Source node for an svg image.
   * @constructor
   * @param {string} name - the node's base name
   * @param {string} dir - the file's directory
   * @method {function} make - make target
   */

  SVG = (function() {

    /* constructor() */
    function SVG(name, dir) {
      this.name = name;
      this.dir = dir;
      this.make = bind(this.make, this);
      this.svg = new Source(this.name, this.dir, 'svg', 'svg');
    }


    /* method make() */

    SVG.prototype.make = function(dest) {
      return this.svg.make(dest);
    };

    return SVG;

  })();


  /* Class QueryURL */


  /**
   * QueryURL
   * @constructor
   * @param {string} base_url - the base url
   * @param {object} query - args for query string 
   * @method {function} get - return full url
   */

  QueryURL = (function() {

    /* constructor() */
    function QueryURL(base_url, query) {
      this.base_url = base_url;
      this.query = query != null ? query : {};
      this.get = bind(this.get, this);
      this.js = {
        ref: (function(_this) {
          return function() {
            return render.js.ref(_this.get());
          };
        })(this)
      };
    }


    /* method get() */

    QueryURL.prototype.get = function() {
      var key, url, val;
      url = this.base_url;
      if (this.query !== {}) {
        url += '?' + ((function() {
          var ref, results;
          ref = this.query;
          results = [];
          for (key in ref) {
            val = ref[key];
            results.push(key + '=' + val);
          }
          return results;
        }).call(this)).join('&');
        url = encodeURI(url);
      }
      return url;
    };

    return QueryURL;

  })();


  /* Class HTML_Template */


  /**
   * An HTML_Template
   * @constructor
   * @param {string} name - the template's base name
   * @param {string} dir - the template's directory
   * @method {function} render - render using supplied obj
   * @method {function} render_min - minify render
   */

  HTML_Template = (function() {

    /* constructor() */
    function HTML_Template(name, dir) {
      this.name = name;
      this.dir = dir;
      this.render = bind(this.render, this);
      this.source = new Source(this.name, this.dir, 'html');
    }


    /* method render() */

    HTML_Template.prototype.render = function(obj) {
      var k, options, v;
      options = {};
      for (k in obj) {
        v = obj[k];
        options[k] = v;
      }
      return mustache.render(this.source.get(), options);
    };

    return HTML_Template;

  })();


  /* HTML_Page */


  /**
   * An HTML_Page instance contains two caching nodes:
   * one for css and one for minified css.
   * @constructor
   * @param {string} name - the node's base name
   * @param {string} template - a mustache template
   * @param {object} data - namespace for template
   * @method {function} make - render and make target
   */

  HTML_Page = (function() {

    /* constructor() */
    function HTML_Page(name, template, data) {
      this.name = name;
      this.template = template;
      this.data = data;
      this.make = bind(this.make, this);
    }


    /* method make() */

    HTML_Page.prototype.make = function(dest) {
      var fname, x;
      fname = this.name + '.html';
      x = this.template.render(this.data);
      fs.writeFileSync(dest + '/' + fname, x);
      return console.log(fname);
    };

    return HTML_Page;

  })();


  /* HTML_Minified_Page */


  /**
   * An HTML_Minified_Page instance contains two caching nodes:
   * one for css and one for minified css.
   * @constructor
   * @param {string} name - the node's base name
   * @param {string} template - a mustache template
   * @param {object} data - namespace for template
   * @method {function} make - render and make target
   */

  HTML_Minified_Page = (function() {

    /* constructor() */
    function HTML_Minified_Page(name, template, data) {
      this.name = name;
      this.template = template;
      this.data = data;
      this.make = bind(this.make, this);
    }


    /* method make() */

    HTML_Minified_Page.prototype.make = function(dest) {
      var fname, x;
      fname = this.name + '.html';
      x = minify.html(this.template.render(this.data));
      fs.writeFileSync(dest + '/' + fname, x);
      return console.log(fname);
    };

    return HTML_Minified_Page;

  })();

  module.exports = {
    Source: Source,
    Apply: Apply,
    CoffeeScript: CoffeeScript,
    JavaScript: JavaScript,
    StyleSheet: StyleSheet,
    SVG: SVG,
    QueryURL: QueryURL,
    HTML_Template: HTML_Template,
    HTML_Page: HTML_Page,
    HTML_Minified_Page: HTML_Minified_Page
  };

}).call(this);
