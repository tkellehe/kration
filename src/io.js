(function(global, characters, Parser, stdin, stdout, NUMBER, STRING, ARRAY, Reference){


//----------------------------------------------------------------------------------------
Parser.tokens[characters.handle_bug("«")] = {
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
Parser.tokens[characters.handle_bug("»")] = {
    tokenize : function(parser, method, iter) {
        method.add({
            exec : function(parser, context) {
                var input = stdin.read("String value requested : ", "STRING", "");
                var param = parser.next_param();
                var content = param.get();
                if(content.type === "ARRAY") {
                    var temp = input.to_number();
                    if(typeof temp === "number" && temp === temp) {
                        input = new NUMBER(temp);
                    }
                    param.set(content.add_item_onto_the_left(input));
                } else if(content.type === "NUMBER") {
                    param.set(new NUMBER(input.to_number()));
                } else {
                    param.set(input);
                }
                // Always push on where placed the result.
                parser.add_param(param.copy());
                return context.next();
            }
        });

        return iter.next();
    }
}


})(this, this.characters, this.Parser, this.stdin, this.stdout, this.NUMBER, this.STRING, this.ARRAY, this.Reference);
