fs = require "fs"

compile = (name) ->
    coffee = require "coffee-script"
    src = fs.readFileSync "src/#{name}.coffee", "utf-8"
    out = coffee.compile(src)
    fs.writeFileSync "build/#{name}.js", out, "utf-8"

compress = (name) ->
    {parser, uglify} = require "uglify"

    src = fs.readFileSync "build/#{name}.js", "utf-8"
    ast = parser.parse src
    ast = uglify.ast_mangle ast  # mangle var names etc.
    ast = uglify.ast_squeeze ast # remove whitespace
    out = uglify.gen_code ast    # generate js source

    fs.writeFileSync "build/#{name}.min.js", out, "utf-8"

task "compile", "compile all the coffee files to js", ->
    compile "core"
    compile "extras"
    compile "dict"

task "compress", "squash the javascript files for distribution", ->
    compress "core"
    compress "extras"
    compress "dict"

task "tests", "run the test suite against the latest compiled js", ->
    testrunner = require "qunit"
    testrunner.options.errorsOnly = no
    testrunner.options.coverage = no
    testrunner.options.paths = ["#{process.cwd()}/build"]

    testrunner.run
         code: "build/core.js"
         tests: "tests/core.js"

    testrunner.run
        code: "build/extras.js"
        tests: "tests/extras.js"
