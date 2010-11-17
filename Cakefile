fs = require "fs"

compile = (name) ->
    coffee = require "coffee-script"
    src = fs.readFileSync "src/#{name}.coffee", "utf-8"

    try
        out = coffee.compile(src)
        fs.writeFileSync "build/#{name}.js", out, "utf-8"
        console.log "compiled #{name}.coffee"
    catch err
        console.log "failed to compile #{name}.coffee "
        throw err

compress = (name) ->
    {parser, uglify} = require "uglify"

    try
        src = fs.readFileSync "build/#{name}.js", "utf-8"
        ast = parser.parse src
        ast = uglify.ast_mangle ast  # mangle var names etc.
        ast = uglify.ast_squeeze ast # remove whitespace
        out = uglify.gen_code ast    # generate js source
        fs.writeFileSync "build/#{name}.min.js", out, "utf-8"

        console.log "compressed #{name}.js"

    catch err
        console.log "failed to compress #{name}"
        throw err


task "compile", "compile all the coffee files to js", ->
    try
        compile "core"
        compile "extras"
        compile "dict"
        console.log "compilation succeeded"
    catch err
        console.log "compilation failed: #{err}"

task "compress", "squash the javascript files for distribution", ->
    invoke "compile"

    try
        compress "core"
        compress "extras"
        compress "dict"
        console.log "compression succeeded"
    catch err
        console.log "compression failed: #{err}"


task "tests", "run the test suite against the latest compiled js", ->
    invoke "compile"

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
