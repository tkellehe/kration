(function(global, characters, Parser, stdin, stdout, NUMBER, STRING, ARRAY, Reference){


//----------------------------------------------------------------------------------------
Parser.tokens[characters.handle_bug("+")] = {
    tokenize : function(parser, method, iter) {
        method.add({
            exec : function(parser, context) {
                var a = parser.next_param().get();
                var b = parser.next_param().get();
                var r = parser.next_param();
                r.set(a.add_item_onto_the_right(b));
                parser.add_param(r.copy());
                return context.next();
            }
        });

        return iter.next();
    }
}


})(this, this.characters, this.Parser, this.stdin, this.stdout, this.NUMBER, this.STRING, this.ARRAY, this.Reference);
