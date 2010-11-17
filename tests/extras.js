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

test("Seq.combine", function (){
    var integers = Seq.iter(1, op('+', 1));
    same(Seq.combine(integers, ['a', 'b']).take(4).purge(),
        [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']],
        "Seq.combine(integers, ['a', 'b'])");
});

test("Seq.range", function (){
    same(Seq.range(1, 6).toArray(), [1, 2, 3, 4, 5], "Seq.range(1, 6)");
    same(Seq.range(1, 10, 2).toArray(), [1, 3, 5, 7, 9], "Seq.range(1, 10, 2)");
    same(Seq.range(1, 3, 0.5).toArray(), [1, 1.5, 2, 2.5], "Seq.range(1, 3, 0.5)");
    same(Seq.range(5, 0, -1).toArray(), [5, 4, 3, 2, 1], "Seq.range(1, 3, 0.5)");
    same(Seq.range(5, 0, 1).toArray(), [], "Seq.range(1, 3, 0.5)");
});

test("Seq.Sequence#partition(n)", function (){
    var seq = Seq.from([1, 2, 3, 4, 5]);

    same(seq.partition(2).purge(), [[1, 2], [3, 4]], "Seq.Sequence#partition(2)");
    same(seq.partition(3).purge(), [[1, 2, 3]], "Seq.Sequence#partition(3)");
    ok(seq.partition(10).isEmpty(), "Seq.Sequence#partition(10)");

    same(seq.partition(0).take(3).purge(), [[], [], []], "Seq.Sequence#partition(0)");
    ok(Seq.isInfinite(seq.partition(0)), "Seq.Sequence#partition(0)");
});

test("Seq.Sequence#partition(n, step)", function (){
    var seq = Seq.from([1, 2, 3, 4, 5]);
    same(
        seq.partition(2, 1).purge(),
        [[1, 2], [2, 3], [3, 4], [4, 5]],
        "Seq.partition step argument works"
    );

    same(
        seq.partition(2).purge(),
        seq.partition(2, 2).purge(),
        "Seq.Sequence#partition(2) is the same as Seq.Sequence#partition(2, 2)"
    );

    same(
        seq.partition(2, 0).take(3).purge(),
        [[1, 2], [1, 2], [1, 2]],
        "Seq.Sequence#partition(n, 0)"
    );

    ok(Seq.isInfinite(seq.partition(2, 0)), "Seq.Sequence#partition(n, 0) is Infinite");
    throws(function (){ seq.partition(-1) }, TypeError, "Seq.Sequence#partition(-1) throws a TypeError");
    throws(function (){ seq.partition(2, -1) }, TypeError, "Seq.Sequence#partition(n, -1) throws a TypeError");
});

test("Seq.Sequence#distinct", function (){
    same(
        Seq.list(1, 1, 1, 2, 2, 2, 2, 2, 3).distinct().toArray(),
        [1, 2, 3],
        "Seq.Sequence#distinct with numbers"
    );

    same(
        Seq.list("a", "A", "b", "B", "B", "c").distinct(caseInsensitive).toArray(),
        ["a", "b", "c"],
        "Seq.Sequence#distinct with a custom equals function"
    );

    function caseInsensitive(a, b){
        return a.toUpperCase() === b.toUpperCase() 
    }
});

test("Seq.Sequence#choose", function (){
    equals(Seq.range(2).choose(3).getLength(), 0, "0 ways to choose 3 from (0, 1)");
    equals(Seq.range(3).choose(3).getLength(), 1, "1 way to choose 3 from (0, 1, 2)");
    equals(Seq.range(3).choose(2).getLength(), 3, "3 ways to choose 2 from (0, 1, 2)");
    equals(Seq.range(3).choose(1).getLength(), 3, "3 ways to choose 1 from (0, 1, 2)");
    equals(Seq.range(4).choose(2).getLength(), 6, "6 ways to choose 2 from (0, 1, 2, 3)");
});



test("Seq.Sequence#unzip", function (){
    same(Seq.zip(Seq.range(1, 6),
                 Seq.repeat(1),
                 Seq.randomIntegers(0, 10)).unzip().first().toArray(),
         Seq.range(1, 6).toArray(),
         "Seq.Sequence#unzip");
});


test("Seq.matches", function (){
    var text = "cats and Dogs and \ncats and dogs";

//    same(Seq.matches(/[a-zA-Z]+/, text).toArray(), [["cats"], ["and"], ["Dogs"], ["and"], ["cats"], ["and"], ["dogs"]]);
    equals(Seq.matches(/dogs/i, text).getLength(), 2, "case-insensitive flag");
    equals(Seq.matches(/^cats/, text).getLength(), 1, "line-start without multiline flag");
    equals(Seq.matches(/^cats/m, text).getLength(), 2, "line-start with multiline flag");
});
