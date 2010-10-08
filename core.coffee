class Sequence
    first: -> throw "not implemented"
    rest: -> throw "not implemented"

class Empty extends Sequence
    first: -> throw "Empty: no first element"
    rest: -> throw "Empty: no rest sequence"

class Stream extends Sequence
    constructor: (@firstv, @restfn) ->
    first: -> @firstv
    rest: -> @memo ?= @restfn()
    memo: undefined

class InfiniteStream extends Stream
class FiniteStream extends Stream

class Eager extends Sequence
    constructor: (@array, @index) -> @index ?= 0
    first: -> @array[@index]
    rest: ->
        next = @index + 1
        if @array.length <= next
            new Empty
        else
            new Eager @array, next

###
Sequence::map(fn)
-------------

For a Sequence `seq`, `seq.map(fn)` returns a lazy sequence of `fn(item)` for each 
item` in `seq`.
###
Sequence::map = (fn) ->
    StreamClass = @streamClass()
    new StreamClass fn(@first()), => @rest().map(fn)

Empty::map = (fn) -> new Empty

###
Sequence::toString 
------------------

Care is taken here not to force any evaluation, if you want to see the entire
contents of the sequence, use `seq.toEager().toString()`
###

Sequence::toString = -> "(...)"
Empty::toString = -> "()"
Eager::toString = -> "(" + @toArray().join(", ") + ")"
Stream::toString = -> "(#{@firstv}, ...)"

###
Sequence::toArray and Sequence::toEager
---------------------------------------

Converting a Sequence to an Array is necessarily eager; therefore InfiniteStreams 
cannot be converted to arrays.

Sequence::toEager similarly forces the entire sequence but returns a Sequence
instead of an Array.
###

Sequence::toArray = ->
    ls = this
    until ls.isEmpty()
        first = ls.first()
        ls = ls.rest()
        first

Empty::toArray = -> []
Eager::toArray = -> @array[@index..]
InfiniteStream::toArray = -> throw "InfiniteStream: cannot be converted to an Array"

Sequence::toEager = -> new Eager @toArray()
Eager::toEager = -> this

### 
Sequence::isFinite and Sequence::isInfinite
-------------------------------------------

These should really be called "is Definitely Finite" and "is Definitely Infinite".

`isInfinite` returns `yes` if the sequence is *known* to be infinite, and `no` otherwise.
`isFinite` returns `yes` if the sequence is *known* to be finite, and `no` otherwise.

By default both methods return `no`, as Sequences cannot be assumed to terminate.

Methods that return streams propagate this information by returning an InfiniteStream, 
FiniteStream or Stream appropriately.

For example, where `a` is known to be infinite, `b` is known to be finite and `c` 
is not known to be either:

    a.append(b, c).isFinite is false
    a.append(b, c).isInfinite is true

    b.append(b, c).isFinite is false
    b.append(b, c).isInfinite is false

    b.append(b, b).isFinite is true
    b.append(b, b).isInfinite is false
###

Sequence::isFinite = -> no
Sequence::isInfinite = -> no

Empty::isFinite = -> yes
Empty::isInfinite = -> no

Eager::isFinite = -> yes
Eager::isInfinite = -> no

FiniteStream::isFinite = -> yes
FiniteStream::isInfinite = -> no

InfiniteStream::isFinite = -> no
InfiniteStream::isInfinite = -> yes

Sequence::streamClass = ->
    if @isInfinite()
        InfiniteStream
    else if @isFinite()
        FiniteStream
    else
        Stream

###
Sequence::isEmpty
-----------------

True for instances of Empty, false for all other Sequences.

This can be used to terminate iteration.
###

Sequence::isEmpty = -> no
Empty::isEmpty = -> yes

###
Sequence::take, Sequence::drop and Sequence::split
--------------------------------------------------

###

Sequence::nth = (n) -> @drop(n).first()
Eager::nth = (n) @array[n + @index]



###
Sequence::append(seqs...)
-------------------------


###

Sequence::append = (seqs...) ->
    StreamClass =
        if @isInfinite() or $some seqs, isInfinite
            InfiniteStream
        else if @isFinite() and $every seqs, isFinite
            FiniteStream
        else
            Stream

    if seqs.length is 0
        this
    else
        new StreamClass @first(), => @rest().append seqs...

Empty::append = (head, tail...) ->
    seq = Sequence.from(head)
    if tail.length > 0 then seq.append tail... else seq



Sequence.fromArray = (arr) -> new Eager slice.call arr
Sequence.fromString = (str) -> Sequence.fromArray str.split ""
Sequence.fromObject = (obj) -> Sequence.fromArray(Sequence.fromArray [value, key] for key, value of obj)
Sequence.from = (obj) ->
    if obj instanceof Array or typeof obj is "array" or (obj.length? and obj.callee?)
        return Sequence.fromArray obj

    if obj instanceof String or typeof obj is "string"
        return Sequence.fromString obj

    if typeof obj is "object"
        return Sequence.fromObject obj

    Sequence.fromArray [obj]

###
Utilities
###

iter = (init..., fn) ->
    iterate = (arr) ->
        new InfiniteStream arr[0], -> iterate [arr[1..]..., fn(arr...)]

    repeater = () -> new InfiniteStream fn(), repeater

    if init.length > 0 then iterate init else repeater()

repeat = (a) -> new InfiniteStream a, -> repeat a

cycle = 
###
$some, $every, $map, and $each are used internally as aliases to 
the native array methods.
###

nativeSome = Array.prototype.some
nativeEvery = Array.prototype.every
nativeMap = Array.prototype.map
nativeEach = Array.prototype.forEach
slice = Array.prototype.slice

$some =
    if nativeSome?
        (arr, fn, bind) -> nativeSome.call arr, fn, bind
    else
        (arr, fn, bind) ->
            i = 0
            while i < arr.length
                return true if fn.call bind, arr[i]
                i ++
            return false

$every =
    if nativeEvery?
        (arr, fn, bind) -> nativeEvery.call arr, fn, bind
    else
        (arr, fn, bind) ->
            i = 0
            while i < arr.length
                return false unless fn.call bind, arr[i]
                i++

            return true

$map =
    if nativeMap?
        (arr, fn, bind) -> nativeMap.call arr, fn, bind
    else
        (arr, fn, bind) -> fn.call(bind, item) for item in arr

$each =
    if nativeEach?
        (arr, fn, bind) -> nativeEach.call arr, fn, bind
    else
        (arr, fn, bind) ->
            fn.call(bind, item) for item in arr
            undefined

Seq = (args...) ->
    if args.length > 1
        Sequence.from args
    else
        Sequence.from args[0]

Seq.Sequence = Sequence
Seq.Empty = Empty
Seq.Stream = Stream
Seq.InfiniteStream = InfiniteStream
Seq.FiniteStream = FiniteStream
Seq.Eager = Eager
Seq.iter = iter


if module?
    module.exports = Seq
else
    this.Seq = Seq
