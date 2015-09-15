var assert = require('chai').assert
    , parser = require('./parser')
    , Readable = require('stream').Readable
    , fs = require('fs')
    , events = require('harken')
    , stream
    , jsonBody
    , formDataBody
    , urlBody
    , errorBody;

describe('Parser Tests', function () {
  'use strict';

    beforeEach(function () {
        stream = new Readable();
        jsonBody = {name: 'Tomas Voekler'};
        formDataBody = fs.createReadStream(process.cwd() + '/test_stubs/formDataBody.txt');
        urlBody = 'name=daniel&title=lord+of+the+actual+internet1';
        errorBody = '{name: "Tomas Voekler"';
    });

    it('should return a function', function () {
        assert.isFunction(parser);
    });

    it('should parse out a multipart/form-data submission', function (done) {
        formDataBody.headers = {
          'content-length': formDataBody.length
          , 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryOR86nFvrvo9BHCQm'
        };

        parser({req: formDataBody}, function (body, err) {
          assert.isUndefined(err);
          assert.isObject(body);
          assert.strictEqual(body.name, 'daniel');
          done();
        });
    });

    it('should parse out a application/x-www-form-urlencoded submission', function (done) {
        stream.push(urlBody);
        stream.push(null);
        stream.headers = {
          'content-length': urlBody.length
          , 'content-type': 'application/x-www-form-urlencoded'
        };

        parser({req: stream}, function (body, err) {
          assert.isUndefined(err);
          assert.isObject(body);
          assert.strictEqual(body.name, 'daniel');
          done();
        });
    });

    it('should parse out a json post/put/update', function (done) {
        stream.push(JSON.stringify(jsonBody));
        stream.push(null);
        stream.headers = {
            'content-length': 24
            , 'content-type': 'application/json'
        };

        parser({req: stream}, function (body) {
            assert.isObject(body);
            done();
        }, {});

    });
    it('should parse out a json post/put/update without the correct header', function (done) {
        stream.push(JSON.stringify(jsonBody));
        stream.push(null);
        stream.headers = {
            'content-length': 24
        };

        parser({req: stream}, function (body) {
            assert.isObject(body);
            done();
        }, {});

    });

    it('should place the parsed elements in body', function (done) {
        stream.push(JSON.stringify(jsonBody));
        stream.push(null);
        stream.headers = {
            'content-length': 24
            , 'content-type': 'application/json'
        };

        parser({req: stream}, function (body) {
            assert.strictEqual(JSON.stringify(body), JSON.stringify(jsonBody));
            done();
        }, {});

    });

    it('should raise error:parse which contains an error message and return null to the parse function when an error occurs', function (done) {
        stream.push(errorBody);
        stream.push(null);
        stream.headers = {
            'content-length': 23
            , 'content-type': 'application/json'
        };

        events.on('error:parse', function (msg) {
            assert.isDefined(msg);
            assert.isObject(msg);
            events.emit('error');
        });

        parser({req: stream}, function (body) {
            assert.isNull(body);
            events.emit('parse');
        }, {});

        events.required(['parse', 'error'], function () {
            done();
        });
    });

  it('should parse out uploaded files');
});