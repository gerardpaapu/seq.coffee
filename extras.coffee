Seq = if require?
    require('Seq').Seq
else
    @Seq

{Sequence, Eager, Empty, InfiniteStream, FiniteStream} = Seq

multiply = (a, b) ->  a * b
add = (a, b) -> a + b

Sequence::sum = -> @reduce add, 0
Sequence::product = -> @reduce multiply, 1
Sequence::min = -> @reduce Math.min
Sequence::max = -> @reduce Math.max

Sequence::invoke = (name, args...) ->
    @map (item) -> item[name](args...)

Sequence::pluck = (key) ->
    @map (item) -> item[name]

Sequence::plucks = (keys...) ->
    @map (item) ->
        Seq.map keys, (key) -> item[key]

Sequence::slice = (from, to) ->
    @drop(from).take(to - from + 1)

Eager::slice = (from, to) ->
    new Eager @toArray().slice(from, to)

Sequence::zip = Sequence::unzip = ->
    @apply(Seq.zip)

Sequence::join = (str) ->
    @toArray().join(str)

Sequence::reverse = ->
    Sequence.fromArray @toArray().reverse()

InfiniteStream::reverse = ->
    throw TypeError "InfiniteStream cannot be reversed"

Sequence::find = Sequence::detect = (test) ->
    seq = @filter(test)
    if seq.isEmpty() then null else seq.first()

Sequence::choose = (n) ->
    choose2 = (seq) ->
        if seq.isEmpty() then return new Empty()

        first = seq.first()
        rest = seq.rest()

        head = Seq.zip Seq.repeat(first), rest
        head.lazyAppend -> choose2 rest

    choose = (seq, n) ->
        prepend = (ls) -> new Seq.Cons seq.first(), ls

        switch n
            when 1 then seq.map Seq.list
            when 2 then choose2 seq
            else choose(seq.rest(), n - 1).map(prepend)

    choose this, n

Sequence::partition = (size, step) ->
    step ?= size
    posint = (n) -> Math.abs(parseInt(n)) is n

    unless posint(size) and posint(step)
        throw TypeError "size and step must be non-negative integers"

    StreamClass = @streamClass()

    slowpartition = (seq, size, step) ->
        if seq.isEmpty() then return new Empty()

        first = seq.take(size)
        rest = seq.drop(step)

        if first.getLength() < size
            new Empty
        else
            new StreamClass first, -> slowpartition rest, size, step

    fastpartition = (seq, size) ->
        if seq.isEmpty() then return new Empty

        split = seq.splitAt(size)
        first = split.take()

        if first.getLength() < size
            new Empty()
        else
            new StreamClass first, -> fastpartition split.drop(), size

    if size is 0
        # Just Empties forever
        Seq.iter -> new Empty

    else if step is 0
        # The first `size` items over and over
        Seq.iter => @take size

    else if size is step
        fastpartition this, size

    else
        slowpartition this, size, step

Sequence::distinct = (eq) ->
    eq ?= (a, b) -> a is b
    StreamClass = @streamClass()

    distinct = (seq) ->
        return new Empty() if seq.isEmpty()

        first = seq.first()
        test = (a) -> eq(a, first)

        new StreamClass first, -> distinct seq.rest().remove(test)

    distinct this

Seq.range = (a, b, c) ->
    range = (start, end, step) ->
        if (start < end and step < 0) or (end < start and 0 < step)
            return new Empty()

        test = if start < end
            (a, b) -> a >= b
        else
            (a, b) -> a <= b

        _range = (n) ->
            if test n, end
                new Empty()
            else
                new FiniteStream n, -> _range n + step

        if start is end
            new Empty()
        else if step is 0
            Seq.repeat start
        else
            _range start

    switch arguments.length
        when 1 then range 0, a, 1 # Seq.range(end)
        when 2 then range a, b, 1 # Seq.range(start, end)
        else        range a, b, c # Seq.range(start, end, step)

Seq.zipply = (seq, fns...) ->
    seq = Sequence.from seq
    id = (x) -> x

    # add the identity function to the head of fns
    _fns = new Cons id, Sequence.fromArray fns
    _fns.map((fn) -> seq.map fn).zip()

Seq.matches = (pattern, str) ->
    flags = 'g'
    if pattern.ignoreCase then flags += 'i'
    if pattern.multiline then flags += 'm'

    re = new RegExp pattern.source, flags

    matches = () ->
        result = re.exec str

        if not result
            new Empty()
        else
            new FiniteStream result, matches

    matches()

Seq.randomIntegers = (min, max) ->
    {random, floor} = Math
    Seq.iter -> floor random * (max - min + 1) + min

Seq.combine = (seqs...) ->
    {map, from, zip, repeat, apply} = Seq
    combine2 = (a, b) ->
        _zip = (seq) -> zip(repeat(seq), b)

        map(a, _zip).flatten()

    combine = (first, second, rest...) ->
        first = from(first)
        seqs = map(arguments, from)
        prepend = (c) -> first.map (seq) -> new Cons seq, c

        switch arguments.length
            when 0 then new Empty()
            when 1 then first
            when 2 then combine2 first, second
            else apply(combine, seqs.rest()).map(prepend).flatten()

    combine seqs...
