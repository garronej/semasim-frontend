
#For semasim

Clone for beeing able to import "stream" and not "stream-browserify".

node_modules are not tracked by git so after restoring project run: 
``npm install --only=prod``



# stream-browserify

the stream module from node core, for browsers!

[![build status](https://secure.travis-ci.org/browserify/stream-browserify.svg)](http://travis-ci.org/browserify/stream-browserify)

# methods

Consult the node core
[documentation on streams](http://nodejs.org/docs/latest/api/stream.html).

# install

With [npm](https://npmjs.org) do:

```
npm install stream-browserify
```

but if you are using browserify you will get this module automatically when you
do `require('stream')`.

# license

MIT
