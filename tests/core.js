function throws(fn, _class, message){
    try {
        fn();
        ok(false, message);
    } catch (err) {
        ok((err instanceof _class), message);
    }
}

function $slice(arr, a, b){
    return Array.prototype.slice.call(arr, a, b);
}

function $curry(fn){
    var args = $slice(arguments, 1);
    return function (){
        var args2 = $slice(arguments);
        return fn.apply(null, args.concat(args2));
    };
}

var op = function op(key){
    var operators = {
        "-": function(a, b) { return arguments.length < 2 ? -a : a -b; },
        "!": function(a) { return !a; },
        "typeof": function(a) { return typeof a; },
        "?": function(a, b, c) { return a ? b : c; },
        "+": function(a, b) { return a + b; },
        "*": function(a, b) { return a * b; },
        "/": function(a, b) { return a / b; },
        "%": function(a, b) { return a % b; },
        "&&": function(a, b) { return a && b; },
        "||": function(a, b) { return a || b; },
        "==": function(a, b) { return a == b; },
        "!=": function(a, b) { return a != b; },
        "===": function(a, b) { return a === b; },
        "!==": function(a, b) { return a !== b; },
        "<": function(a, b) { return a < b; },
        ">": function(a, b) { return a > b; },
        ">=": function(a, b) { return a >= b; },
        "<=": function(a, b) { return a <= b; },
        "in": function(a, b) { return a in b; },
        "instanceof": function(a, b) { return a instanceof b; }
    };

    var l = arguments.length, 
        fun = operators[key],
        args = Array.prototype.slice.call(arguments, 1); 

    return l < 2 ? fun : $curry.apply(null, [fun].concat(args)); 
};

test("Seq.Empty()", function(){
    ok(new Seq.Empty() instanceof Seq.Sequence, "Seq.Empty inherits from Seq.Sequence");
});

test("Seq.Empty() accessors", function (){
    throws(function(){ new Seq.Empty().first(); }, Error, "Seq.Empty().first() throws an Error");
    throws(function(){ new Seq.Empty().rest(); }, Error, "Seq.Empty().rest() throws an Error");

    ok(new Seq.Empty().isEmpty(), "Seq.Empty is empty");
    equals(new Seq.Empty().getLength(), 0, "Seq.Empty length");
    same(new Seq.Empty().toArray(), [], "Seq.Empty#toArray");
});

test("Seq.Empty#append", function (){
    var nil = new Seq.Empty();

    same(nil.append([1, 2, 3]).toArray(), [1, 2, 3], "append an array");
    same(nil.append([1, 2, 3], [4, 5, 6]).toArray(), [1, 2, 3, 4, 5, 6], "append multiple arrays");

    ok(nil.append(nil).isEmpty(), "appending empty sequence to an empty sequence is empty"); 
    ok(nil.append([]).isEmpty(), "appending [] to an empty sequence is empty");
    ok(nil.append([], []).isEmpty(), "appending [] to an empty sequence is empty");
});

test("Seq.Empty#flatten", function (){
    ok(new Seq.Empty().flatten().isEmpty(), "Seq.Empty#flatten is empty");
});

test("Seq.Empty#sort", function (){
    ok(new Seq.Empty().sort(op('<')).isEmpty(), "Seq.Empty#sort is empty");
});

test("Seq.EagerSequence", function (){
    var seq = Seq.from([1, 2, 3, 4, 5]);

    ok(seq instanceof Seq.Sequence, "seq is a Sequence"); 
    ok(seq instanceof Seq.EagerSequence, "seq is an EagerSequence"); 
});

test("Seq.EagerSequence accessors", function (){
    var seq = Seq.from([1, 2, 3, 4, 5]);

    equals(seq.first(), 1, "seq.first()"); 
    same(seq.rest().toArray(), [2, 3, 4, 5], "seq.rest()"); 

    equals(seq.getLength(), 5, "seq length is 5"); 
    ok(!seq.isEmpty(), "seq is not empty");
    same(seq.toArray(), [1, 2, 3, 4, 5], "seq#toArray");
});

test("Seq.EagerSequence#append", function (){
    var seq = Seq.from([1, 2]);

    same(seq.append([3, 4]).toArray(), [1, 2, 3, 4], "appending an array");
    same(seq.append(3, 4).toArray(), [1, 2, 3, 4], "appending atoms");
    same(seq.append([3, 4], [5, 6]).toArray(), [1, 2, 3, 4, 5, 6], "appending multiple arrays");
    same(seq.append([]).toArray(), [1, 2], "appending an empty array");
    same(seq.append([], []).toArray(), [1, 2], "appending multiple empty arrays");
    same(seq.append([], [], [3, 4]).toArray(), [1, 2, 3, 4], "appending a mix of empty/non-empty arrays");
});

test("Seq.EagerSequence#splitAt", function (){
    var seq = Seq.from([1, 2, 3, 4, 5]);

    same(seq.drop(2).toArray(), [3, 4, 5], "seq.drop(2)");
    equals(seq.drop(2).getLength(), 3, "seq.drop(2).getLength()");
    same(seq.take(2).toArray(), [1, 2], "seq.take(2)");
});

test("Seq.EagerSequence#nth", function (){
    var seq = Seq.from([1, 2, 3, 4, 5]);

    // the index argument should be a positive integer n
    // where l is the length of the sequence and 0 <= n < l
    equals(seq.nth(0), 1, "index in bounds");
    equals(seq.nth(2), 3, "index in bounds");

    throws(function (){ seq.nth(9) }, RangeError, "index out of bounds");
    throws(function (){ seq.nth(0.5) }, TypeError, "non-integer index");
    throws(function (){ seq.nth(-1) }, TypeError, "negative index");
    throws(function (){ seq.nth("cats") }, TypeError, "bad index");
});

test("Seq.EagerSequence#doRun", function (){
    var seq = Seq.from([1, 2, 3, 4, 5]);

    equals(seq.doRun(), seq, "Seq.EagerSequence#doRun returns itself");
});

test("Seq.EagerSequence#flatten", function (){
    
    same(Seq.from([1, 2, 3, 4, 5]).flatten().toArray(), [1, 2, 3, 4, 5], "Flatten a flat sequence");
    same(Seq.from([[1, 2], [3, 4, 5]]).flatten().toArray(), [1, 2, 3, 4, 5], 
        "Flatten a sequence of sequences");
    same(Seq.from([[1, 2], 3, [4, 5]]).flatten().toArray(), [1, 2, 3, 4, 5],
        "Flatten a mix of sequences and atoms");
});

test("Seq.InfiniteStream", function (){
    var seq = Seq.repeat(1);
    ok(seq instanceof Seq.Sequence, "seq is a Seq.Sequence");
    ok(seq instanceof Seq.Stream, "seq is a Seq.Stream");
    ok(seq instanceof Seq.InfiniteStream, "seq is a Seq.InfiniteStream");
});

test("Seq.InfiniteStream accessors", function (){
    var seq = Seq.repeat(1);

    equals(seq.first(), 1, "Seq.InfiniteStream#first()");
    ok(seq.rest() instanceof Seq.InfiniteStream, "Seq.InfiniteStream#first()");
    equals(seq.getLength(), Infinity, "Infinite Stream is Infinity long"); 
    ok(!seq.isEmpty(), "Infinite Stream is not empty");
    throws(function (){ seq.toArray() }, Error, "Infinite Stream can't be converted to an Array");
});

test("Seq.InfiniteStream eager methods", function (){
    var seq = Seq.repeat(1);
    
    throws(function (){ seq.doRun() }, Error, "Seq.InfiniteStream#doRun throws an Error");
    throws(function (){ seq.sort(op("<")) }, Error, "Seq.InfiniteStream#sort throws an Error");
    throws(function (){ seq.reduce(op("+"), 0) }, Error, "Seq.InfiniteStream#reduce throws an Error");
});

test("Seq.InfiniteStream#flatten", function (){
    same(Seq.repeat(1).flatten().take(4).toArray(), [1, 1, 1, 1], "Seq.InfiniteStream#flatten doesn't choke");
    same(Seq.repeat([1, 2]).flatten().take(4).toArray(), [1, 2, 1, 2],
        "Seq.InfiniteStream#flatten actually flattens");
});

test("Seq.InfiniteStream#splitAt", function (){
    var seq = Seq.iter(1, op("+", 1));

    same(seq.take(5).toArray(), [1, 2, 3, 4, 5], "Seq.InfiniteStream#take"); 
    ok(seq.drop(5) instanceof Seq.InfiniteStream, "Seq.InfiniteStream#drop"); 
    equals(seq.drop(5).first(), 6, "Seq.InfiniteStream#drop"); 
});


test("Seq.Sequence#splitAt", function (){
    var fail = function (){ throw "fail"; },
        seq = Seq.list(1, 2, 3).append(new Seq.Stream(4, fail));
    
    same(seq.take(4).toArray(), [1, 2, 3, 4], "Seq.Sequence#splitAt is lazy");
});

test("Seq.Sequence#splitWith", function (){
    var seq = Seq.from([1, 2, 3, 4, 5]),
        split = seq.splitWith(op('>=', 3)),
        take = split.take(),
        drop = split.drop();

    same(take.toArray(), [1, 2, 3], "Seq.Sequence#splitWith().take()");
    same(drop.toArray(), [4, 5], "Seq.Sequence#splitWith().drop()");
});

test("Seq.Sequence#filter", function (){
    var seq = Seq.from([1, 2, 3, 4, 5, 6, 7, 8]), 
        seq2 = Seq.cycle(0, 1, 2, false, null).take(10);

    same(seq.filter(even).toArray(), [2, 4, 6, 8], "filter for even values");
    same(seq.remove(even).toArray(), [1, 3, 5, 7], "remove even values");

    same(seq2.filter().toArray(), [1, 2, 1, 2], "filter for truthy values");
    same(seq2.remove().toArray(), [0, false, null, 0, false, null], "remove truthy values");

    function even(n){
        return n % 2 === 0;
    }
});


test("Seq.Sequence#apply", function (){
    equal(Seq.list(1, 2, 3, 4).apply(function (a, b, c, d){
        return a + b + c + d;
    }), 10);
});

test("Seq.iter", function (){
    function wrap(str){
        return "("+str+")";
    }

    equals(Seq.iter('()', wrap).nth(5), "(((((())))))", "Seq.iter on strings");
    same(Seq.iter(1, 1, op('+')).take(5).toArray(), [1, 1, 2, 3, 5], "The fibonacci sequence"); 
});

test("Seq.zip", function (){
    var seq = Seq.zip(Seq.repeat("p"), Seq.list(1, 2)),
        seq2 = Seq.zip(Seq.repeat("a"), Seq.repeat(1)); 

    same(seq.purge(), [["p", 1], ["p", 2]], "Seq.zip with a Seq.InfinitStream"); 
    ok(seq2 instanceof Seq.InfiniteStream, "Seq.zip on Seq.InfinitStreams is a Seq.InfinitStream");
    same(seq2.take(3).purge(), [["a", 1], ["a", 1], ["a", 1]], "Seq.zip"); 
});

test("Seq.repeat", function (){
    same(Seq.repeat(1).take(5).toArray(), [1, 1, 1, 1, 1], "Seq.repeat(1).take(5)");
});

test("Seq.cycle", function (){
    same(Seq.cycle(1, 2, 3).take(5).toArray(), [1, 2, 3, 1, 2], "Seq.cycle");
});

test("Seq.fromObject", function (){
    same(Seq({'foo': "bar", 'baz': "quux"}).purge(), [["bar", "foo"], ["quux", "baz"]])
});

test("Seq.Sequence#toObject", function (){
    same(Seq.zip(Seq.list(1, 2, 3), Seq.list('1st', '2nd', '3rd')).toObject(),
        {'1st': 1, '2nd': 2, '3rd': 3});
});
