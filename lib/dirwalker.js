// Generated by CoffeeScript 1.3.3
(function() {
  var DirWalker, EventEmitter, async, fs, path,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  fs = require('fs');

  path = require('path');

  EventEmitter = require('events').EventEmitter;

  async = require('async');

  module.exports = DirWalker = (function(_super) {

    __extends(DirWalker, _super);

    function DirWalker(root) {
      this.root = root != null ? root : process.cwd();
      this.files = {};
      this.stats = {};
      this.readCount = 0;
      this.FILE_TYPES = ['File', 'Directory', 'BlockDevice', 'FIFO', 'Socket', 'CharacterDevice', 'SymbolicLink'];
    }

    DirWalker.prototype._end = function() {
      var flatstats, k, k2, v, v2, _ref;
      flatstats = {};
      _ref = this.stats;
      for (k in _ref) {
        v = _ref[k];
        for (k2 in v) {
          v2 = v[k2];
          flatstats[k2] = v2;
        }
      }
      return this.emit('end', this.files, flatstats);
    };

    DirWalker.prototype._readEnd = function(dir) {
      this.emit('read', dir, this.stats[dir]);
      this.readCount -= 1;
      if (this.readCount === 0) {
        return this._end();
      }
    };

    DirWalker.prototype._reportFile = function(file, type, stat) {
      var _base, _ref, _ref1;
      if ((_ref = (_base = this.files)[type]) == null) {
        _base[type] = [];
      }
      if ((_ref1 = this.files[type]) != null) {
        _ref1.push(file);
      }
      this.emit(type, file, stat);
      if (type === 'Directory') {
        this.readCount += 1;
        return this._readdir(file);
      }
    };

    DirWalker.prototype._readdir = function(dir) {
      var _this = this;
      this.stats[dir] = {};
      return fs.readdir(dir, function(err, files) {
        var v, _i, _len, _ref;
        if (err) {
          _ref = _this.files;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            v = _ref[_i];
            if (v !== dir) {
              _this.files = v;
            }
          }
          return _this._readEnd(dir);
        } else {
          return async.forEach(files, function(file, callback) {
            var filepath;
            filepath = path.join(dir, file);
            return fs.lstat(filepath, function(err, stat) {
              var type;
              _this.stats[dir][filepath] = stat;
              if (err || (typeof _this.filter === "function" ? _this.filter(filepath, stat) : void 0)) {
                return callback();
              } else {
                type = _this.getFileType(stat);
                if (type) {
                  _this._reportFile(filepath, type, stat);
                } else {
                  _this.emit('Unknown', filepath, stat);
                }
                return callback();
              }
            });
          }, function() {
            return _this._readEnd(dir);
          });
        }
      });
    };

    DirWalker.prototype.getFileType = function(stat) {
      var v, _i, _len, _ref;
      _ref = this.FILE_TYPES;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        v = _ref[_i];
        if (stat["is" + v]()) {
          return v;
        }
      }
      return false;
    };

    DirWalker.prototype.setFilter = function(fn) {
      if (typeof fn === 'function') {
        return this.filter = fn;
      }
    };

    DirWalker.prototype.walk = function() {
      var _this = this;
      return fs.lstat(this.root, function(err, stat) {
        if (err || (typeof _this.filter === "function" ? _this.filter(_this.root, stat) : void 0)) {
          _this.emit('nofile', err);
          return _this._end();
        } else if (!stat.isDirectory()) {
          _this.emit('not dir', _this.root, stat);
          return _this._end();
        } else {
          return _this._reportFile(_this.root, 'Directory', stat);
        }
      });
    };

    return DirWalker;

  })(EventEmitter);

}).call(this);
