class Sequence
    first: -> throw "not implemented"
    rest: -> throw "not implemented"
    isEmpty: -> false

    toArray: ->
        ls = this
        until ls.isEmpty()
            first = ls.first()
            ls = ls.rest()
            first

    map: (fn) -> new Stream fn(@first()), => @rest().map(fn)
    append: (seqs...) -> new Stream @first(), => @rest().append(seqs...)

class Empty extends Sequence
    first: -> throw "Empty: no first element"
    rest: -> throw "Empty"
    isEmpty: -> true
    toArray: -> []
    toString: -> "()"
    map: (fn) -> new Empty
    append: (seqs...) -> Seq.from(seqs[0]).append seqs[1..]...

class Stream extends Sequence
    constructor: (@firstv, @restfn) ->
    first: -> @firstv
    rest: -> @restm ?= @restfn()
    restm: undefined
    toString: -> "(#{@firstv}, ...)"

class Eager extends Sequence
    constructor: (@array, @index) -> @index ?= 0
    first: -> @array[@index]
    rest: ->
        if (@array.length - 1) <= @index
            new Empty
        else
            new Eager @array, @index + 1

    toArray: -> @array[@index..]
    toString: -> "(#{@array.join ", "})"

fromArray = (arr) -> new Eager arr
list = (arr...) -> fromArray arr

exports ?= this
exports.Sequence = Sequence
exports.Empty = Empty
exports.Eager = Eager
exports.Stream = Stream
exports.fromArray = fromArray
