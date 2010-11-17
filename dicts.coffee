## Sequences as Dictionaries
## -------------------------
##
## This code provides utilities for treating seqs as dictionaries,
## you can't always just convert to an object because the sequence
## might e.g. be infinite
##
## They assume a Sequence where `{ key: value, ... }` is
## represented as `((value, key), ...)`
##
## These are produced by `Sequence.fromObject({ key: value, ... })` 
## or by using `Seq.zip(values, keys)`

{Sequence, Cons, list} = @Seq

## Sequence::get
## -------------
##
## Look through each pair in the sequence, if the key matches,
## return the value

Sequence::get = (key) ->
    seq = this
    until seq.isEmpty()
        if seq.first() is key
            return seq.nth 1
        else
            seq = seq.rest()

    return undefined

## Sequence::set
## -------------
##
## Prepend a key, value pair to the head of the sequence.
## Sequence::get starts looking from the head so it should replace
## the previous value

Sequence::set = (key, value) -> new Cons list(value, key), this

## Sequence::dictMap
## -----------------
##
## Map over a dictionary sequence, preserving the keys

Sequence::dictMap = (fn) ->
    @map (pair) ->
        value = pair.first()
        key = pair.rest()

        list fn(value), key
