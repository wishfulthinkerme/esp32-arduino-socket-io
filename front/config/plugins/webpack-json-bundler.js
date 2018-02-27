var objectPath = require('object-path');
var deepAssign = require('deep-assign');
var fs = require('file-system');

function JsonBundlerPlugin(options) {
    this.opts = options || {};
    this.omit = this.opts.omit || '';
    this.fileInput = this.opts.fileInput || '';
    this.rootDirectory = this.opts.rootDirectory || '';
    this.localeDirectory = this.opts.localeDirectory || '';

    // concatenate all JSON files for translations
    this.gatherJson = function(compilation) {
        var contents = {};
        fs.recurseSync(this.rootDirectory, [this.fileInput], function(filepath, relative, filename) {
            // watch file for hot reloading
            compilation.fileDependencies.push(filepath);

            // read path and modify for creating JSON
            var localePath = relative.replace(this.omit, '').replace(filename, '');
            localePath = localePath.replace(/^\/|\/$/g, '').replace(/\//g, '.');
            var content = {};
            var data = fs.readFileSync(filepath, 'utf8');
            objectPath.set(content, localePath, JSON.parse(data));
            contents[filename] = contents[filename] || {};
            deepAssign(contents[filename], content);
        }.bind(this));
        return contents;
    }.bind(this);
}

JsonBundlerPlugin.prototype.apply = function(compiler) {
      compiler.plugin("emit", function(compilation, callback) {
        var fullJSON = this.gatherJson(compilation);

        // write each translation locale content in a separate file
        Object
            .keys(fullJSON)
            .map(fileName => {
                var values = deepAssign({}, fullJSON[fileName]);
                compilation.assets[this.localeDirectory + fileName] = {
                    source: function() {
                      console.log(values)
                        return new Buffer(JSON.stringify(values));
                    },
                    size: function() {
                        return Buffer.byteLength(JSON.stringify(values));
                    }
                };
            });
        callback();
      }.bind(this));
};

module.exports = JsonBundlerPlugin;
