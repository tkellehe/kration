(function(global, characters, Parser, stdin, stdout, NUMBER, STRING, Reference){


//----------------------------------------------------------------------------------------
Parser.tokens[characters.handle_bug("»")] = {
    tokenize : function(parser, method, iter) {
        method.add({
            exec : function(parser, context) {
                var param = parser.next_param();
                stdout.write(param.get());
                return context.next();
            }
        });

        return iter.next();
    }
}

//----------------------------------------------------------------------------------------
Parser.tokens[characters.handle_bug("«")] = {
    tokenize : function(parser, method, iter) {
        method.add({
            exec : function(parser, context) {
                var input = stdin.read("String value requested : ", "STRING", "");
                var param = parser.next_param();
                param.set(input);
                return context.next();
            }
        });

        return iter.next();
    }
}


})(this, this.characters, this.Parser, this.stdin, this.stdout, this.NUMBER, this.STRING, this.Reference);
