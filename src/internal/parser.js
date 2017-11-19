(function(global, characters, NUMBER, STRING, ARRAY, stdout, stdin, Reference){


//----------------------------------------------------------------------------------------
function char_iter(s, i) {
    this.index = i === undefined ? 0 : i;
    this.content = s;
    this.next = function() {
        return this.index+1 < this.content.length ? (new char_iter(this.content, this.index+1)) : undefined;
    }
    this.next_n = function(n) {
        return this.index+n < this.content.length ? (new char_iter(this.content, this.index+n)) : undefined;
    }
    this.prev = function() { return 0 < this.index-1 ? new char_iter(this.content, this.index-1) : undefined; }
    this.prev_n = function(n) { return 0 < this.index-n ? new char_iter(this.content, this.index-n) : undefined; }
    this.set = function(c) { this.content[this.index] = c; }
    this.get = function() { return this.content[this.index]; }
}

Parser.tokens = {};

//----------------------------------------------------------------------------------------
function Parser(code, is_debug) {
    this.props = { };
    this.regs = [new NUMBER(0), new STRING(""), new ARRAY([])];
    this.params = [];
    this.params.loc = -1;
    this.methods = [];
    this.call_stack = [];
    this.structs = {};

    this.is_debug = !!is_debug;
    this.debug = [];

    this.is_valid = typeof code === "string" && code.length !== 0;

    if(this.is_valid) {
        // First move all of the code into the correct spots.
        this.context_code = code.split("\n");
        this.reg_code = this.context_code.shift();

        // Now can parse the param order logic.
        this.parse_params();
    }

}

//////////////////////////////////////////////////////////////////////////////////////////
//----------------------------------------------------------------------------------------
Parser.is_valid_param = function(p) {
    return p !== undefined && p !== null && (p.is_reference_type);
}
//----------------------------------------------------------------------------------------
Parser.prototype.next_param = function() {
    var loc = ++this.params.loc;
    
    if(this.params[loc] === undefined) {
        if(this.params.length === 0) {
            this.params[loc] = new Reference(this.regs, 0);
        } else if(this.params.length === 1) {
            var p = this.params[0];
            if(p.is_reference_type) {
                var reg = (p.prop + 1)%this.regs.length;
                this.params[loc] = new Reference(this.regs, reg);
            }
        } else {
            var p0 = this.params[loc-2];
            var p1 = this.params[loc-1];
            if(p0.is_reference_type && p1.is_reference_type) {
                this.params[loc] = new Reference(this.regs, +("012".replace(p0.prop, "").replace(p1.prop, "")[0]));
            }
        }
    }
    
    return this.params[loc];
}
//----------------------------------------------------------------------------------------
Parser.prototype.add_param = function(p) {
    if(Parser.is_valid_param(p)) {
        this.add_param(p);
    }
}
//----------------------------------------------------------------------------------------
Parser.prototype.log = function(msg) {
    var e = new Error();
    var lines = e.stack.split("\n");
    console.log(lines[2]);
    var reg = /^\s*at\s*(.+)\s+\W*(\w[\w\W]*)\:(\d+)\:(\d+)[^\d]*$/;
    var cap = reg.exec(lines[2]);

    if(cap) {
        var method = cap[1];
        var file = cap[2];
        var ln = cap[3];
        var col = cap[4];
    }
    this.debug.push({ method: method, file: file, ln: ln, col: col, msg: msg });
}
//----------------------------------------------------------------------------------------
Parser.prototype.step = function() {
    if(this.context === undefined) {
        this.context = this.methods[this.methods.length-1];
        if(this.context === undefined) {
            return false;
        }
        this.context.reset();
    }


    var op = this.context[this.context.pc];
    this.context = op.exec(this, this.context);
    if(this.context === undefined) {
        return false;
    }
    return true;
}
//----------------------------------------------------------------------------------------
Parser.prototype.tokenize = function() {
    // Loop through each context creating a list of operations to use for that method.
    for(var i = this.context_code.length; i--;) {
        var code = this.context_code[i];
        var iter = new char_iter(code, 0);
        var method = [];
        this.methods.push(method);
        method.parser = this;
        method.pc = -1;
        method.add = function(op) {
            this.push(op);
        };
        method.reset = function() { this.pc = 0; }
        method.next = function() {
            this.pc = this.pc !== -1 && this.pc+1 < this.length ? this.pc + 1 : -1;
            return this;
        };
        method.prev = function() {
            this.pc = 0 <= this.pc-1 ? this.pc-1 : -1;
            return this;
        };
        method.jump_to = function(loc) {
            if(0 <= loc && loc < this.length) {
                this.pc = loc;
            } else {
                // Force the context to end.
                this.pc = this.length-1;
            }
            return this;
        }
        method.index = i;
        method.add({
            exec: function(parser, context) {
                parser.call_stack.push(method.index);
                method.reset();
                return method.next();
            }
        });
        while(iter) {
            var token = Parser.tokens[iter.get()];
            if(token) {
                iter = token.tokenize(this, method, iter);
            } else {
                if(this.is_debug) {
                    this.log("Character '" + iter.get() + "' is not a valid token.");
                }
                iter = iter.next();
            }
        }
        method.add({
            exec: function(parser, context) {
                var i = parser.call_stack.pop();
                i = parser.call_stack.pop();
                if(i !== undefined) {
                    return parser.methods[i];
                }
                return undefined;
            }
        });
    }
}
//////////////////////////////////////////////////////////////////////////////////////////
//----------------------------------------------------------------------------------------
Parser.prototype.parse_params = function() {
    for(var iter = new char_iter(this.reg_code); iter;) {
        iter = this.process_param_token(iter);
    }
}
//----------------------------------------------------------------------------------------
Parser.prototype.process_param_token = function(iter) {
    var bits = characters.bitify_char(iter.get());
    if(bits[0]) {
        // Special command for processing bits.
        iter = this.handle_param_cmds_specific(iter, bits);
    } else {
        // Param specific command.
        iter = this.handle_param_specific(iter, bits);
    }
    return iter;
}
//----------------------------------------------------------------------------------------
Parser.prototype.handle_param_cmds_specific = function(iter, bits) {
    // Map each value to a unique permutation.
    var value = characters.char_to_int(iter.get());
    
    // There are 127 different combinations.
    var base = 128;
    
    //************************************************************************************
    // Character code repeat section (10).
    var p = iter.prev();
    if(base+0 <= value && value < base+10 && p) {
        // +1
        if(value === base+0) {
            this.process_param_token(p);
        }
        // +2
        else if(value === base+1) {
            this.process_param_token(p);
            this.process_param_token(p);
        }
        // +3
        else if(value === base+2) {
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
        }
        // +4
        else if(value === base+3) {
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
        }
        // +5
        else if(value === base+4) {
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
        }
        // +6
        else if(value === base+5) {
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
        }
        // +7
        else if(value === base+6) {
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
        }
        // +8
        else if(value === base+7) {
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
        }
        // +9
        else if(value === base+8) {
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
        }
        // +10
        else if(value === base+9) {
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
            this.process_param_token(p);
        }
    }
    //************************************************************************************
    else {
        if(this.is_debug) {
            this.log("Commands like '"+iter.get()+"' currently are not supported for more complicated parameter sequences.");
        }
        return undefined;
    }

    return iter.next();
}
//----------------------------------------------------------------------------------------
Parser.prototype.handle_param_specific = function(iter, bits) {
    // Map each value to a unique permutation.
    var value = characters.char_to_int(iter.get());

    // There are 128 different combinations.
    var cmp = 0;

    // 0
    if(value === cmp++) {
        this.add_param(new Reference(this.regs, 0));
    }
    // 1
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }
    // 2
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 2));
    }
    //------------------------------------------------------------------------------------
    // 00
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 0));
        this.add_param(new Reference(this.regs, 0));
    }
    // 01
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 0));
        this.add_param(new Reference(this.regs, 1));
    }
    // 02
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 0));
        this.add_param(new Reference(this.regs, 2));
    }
    // 10
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
        this.add_param(new Reference(this.regs, 0));
    }
    // 11
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
        this.add_param(new Reference(this.regs, 1));
    }
    // 12
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
        this.add_param(new Reference(this.regs, 2));
    }
    // 20
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 2));
        this.add_param(new Reference(this.regs, 0));
    }
    // 21
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }
    // 22
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }

    //------------------------------------------------------------------------------------
    // 012
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }
    // 021
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }
    // 102
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }
    // 120
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }
    // 201
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }
    // 210
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }

    else {
        if(this.is_debug) {
            this.log("The character '" + iter.get() + "' is not supported as parameter sequence code.");
        }
        return undefined;
    }
    return iter.next();
}
//////////////////////////////////////////////////////////////////////////////////////////


//----------------------------------------------------------------------------------------
global.Parser = Parser;
global.Parser.char_iter = char_iter;


})(this, this.characters, this.NUMBER, this.STRING, this.ARRAY, this.stdout, this.stdin, this.Reference);
(function(global, characters, NUMBER, STRING, ARRAY, stdout, stdin, Reference){


//----------------------------------------------------------------------------------------
function char_iter(s, i) {
    this.index = i === undefined ? 0 : i;
    this.content = s;
    this.next = function() {
        return this.index+1 < this.content.length ? (new char_iter(this.content, this.index+1)) : undefined;
    }
    this.next_n = function(n) {
        return this.index+n < this.content.length ? (new char_iter(this.content, this.index+n)) : undefined;
    }
    this.prev = function() { return 0 < this.index-1 ? new char_iter(this.content, this.index-1) : undefined; }
    this.prev_n = function(n) { return 0 < this.index-n ? new char_iter(this.content, this.index-n) : undefined; }
    this.set = function(c) { this.content[this.index] = c; }
    this.get = function() { return this.content[this.index]; }
}

Parser.tokens = {};

//----------------------------------------------------------------------------------------
function Parser(code, is_debug) {
    this.props = { };
    this.regs = [new NUMBER(0), new STRING(""), new ARRAY([])];
    this.params = [];
    this.params.loc = -1;
    this.methods = [];
    this.call_stack = [];
    this.structs = {};

    this.is_debug = !!is_debug;
    this.debug = [];

    this.is_valid = typeof code === "string" && code.length !== 0;

    if(this.is_valid) {
        // First move all of the code into the correct spots.
        this.context_code = code.split("\n");
        this.reg_code = this.context_code.shift();

        // Now can parse the param order logic.
        this.parse_params();
    }

}

//////////////////////////////////////////////////////////////////////////////////////////
//----------------------------------------------------------------------------------------
Parser.is_valid_param = function(p) {
    return p !== undefined && p !== null && (p.is_reference_type);
}
//----------------------------------------------------------------------------------------
Parser.prototype.next_param = function() {
    this.params.loc += 1;
    return this.params[this.params.loc];
}
//----------------------------------------------------------------------------------------
Parser.prototype.add_param = function(p) {
    if(Parser.is_valid_param(p)) {
        this.params.push(p);
    }
}
//----------------------------------------------------------------------------------------
Parser.prototype.log = function(msg) {
    var e = new Error();
    var lines = e.stack.split("\n");
    console.log(lines[2]);
    var reg = /^\s*at\s*(.+)\s+\W*(\w[\w\W]*)\:(\d+)\:(\d+)[^\d]*$/;
    var cap = reg.exec(lines[2]);

    if(cap) {
        var method = cap[1];
        var file = cap[2];
        var ln = cap[3];
        var col = cap[4];
    }
    this.debug.push({ method: method, file: file, ln: ln, col: col, msg: msg });
}
//----------------------------------------------------------------------------------------
Parser.prototype.step = function() {
    if(this.context === undefined) {
        this.context = this.methods[this.methods.length-1];
        if(this.context === undefined) {
            return false;
        }
        this.context.reset();
    }


    var op = this.context[this.context.pc];
    this.context = op.exec(this, this.context);
    if(this.context === undefined) {
        return false;
    }
    return true;
}
//----------------------------------------------------------------------------------------
Parser.prototype.tokenize = function() {
    // Loop through each context creating a list of operations to use for that method.
    for(var i = this.context_code.length; i--;) {
        var code = this.context_code[i];
        var iter = new char_iter(code, 0);
        var method = [];
        this.methods.push(method);
        method.parser = this;
        method.pc = -1;
        method.add = function(op) {
            this.push(op);
        };
        method.reset = function() { this.pc = 0; }
        method.next = function() {
            this.pc = this.pc !== -1 && this.pc+1 < this.length ? this.pc + 1 : -1;
            return this;
        };
        method.prev = function() {
            this.pc = 0 <= this.pc-1 ? this.pc-1 : -1;
            return this;
        };
        method.jump_to = function(loc) {
            if(0 <= loc && loc < this.length) {
                this.pc = loc;
            } else {
                // Force the context to end.
                this.pc = this.length-1;
            }
            return this;
        }
        method.index = i;
        method.add({
            exec: function(parser, context) {
                parser.call_stack.push(method.index);
                method.reset();
                return method.next();
            }
        });
        while(iter) {
            var token = Parser.tokens[iter.get()];
            if(token) {
                iter = token.tokenize(this, method, iter);
            } else {
                if(this.is_debug) {
                    this.log("Character '" + iter.get() + "' is not a valid token.");
                }
                iter = iter.next();
            }
        }
        method.add({
            exec: function(parser, context) {
                var i = parser.call_stack.pop();
                i = parser.call_stack.pop();
                if(i !== undefined) {
                    return parser.methods[i];
                }
                return undefined;
            }
        });
    }
}
//////////////////////////////////////////////////////////////////////////////////////////
//----------------------------------------------------------------------------------------
Parser.prototype.parse_params = function() {
    for(var iter = new char_iter(this.reg_code); iter; iter = iter && iter.next()) {
        var bits = characters.bitify_char(iter.get());
        if(bits[0]) {
            // Special command for processing bits.
            iter = this.handle_param_cmds_specific(iter, bits);
        } else {
            // Param specific command.
            iter = this.handle_param_specific(iter, bits);
        }
    }
}
//----------------------------------------------------------------------------------------
Parser.prototype.handle_param_cmds_specific = function(iter, bits) {
    // Map each value to a unique permutation.
    var value = characters.char_to_int(iter.get());
    
    // There are 127 different combinations.
    var base = 128;
    
    //************************************************************************************
    // Character code repeat section (10).
    if(base+0 <= value && value < base+10 && this.params.length) {
        // +1
        if(value === base+0) {
            var p = this.params[this.params.length-1];
            this.add_param(p.copy());
        }
        // +2
        else if(value === base+1) {
            var p = this.params[this.params.length-1];
            this.add_param(p.copy());
            this.add_param(p.copy());
        }
        // +3
        else if(value === base+2) {
            var p = this.params[this.params.length-1];
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
        }
        // +4
        else if(value === base+3) {
            var p = this.params[this.params.length-1];
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
        }
        // +5
        else if(value === base+4) {
            var p = this.params[this.params.length-1];
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
        }
        // +6
        else if(value === base+5) {
            var p = this.params[this.params.length-1];
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
        }
        // +7
        else if(value === base+6) {
            var p = this.params[this.params.length-1];
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
        }
        // +8
        else if(value === base+7) {
            var p = this.params[this.params.length-1];
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
        }
        // +9
        else if(value === base+8) {
            var p = this.params[this.params.length-1];
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
        }
        // +10
        else if(value === base+9) {
            var p = this.params[this.params.length-1];
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
            this.add_param(p.copy());
        }
    }
    //************************************************************************************
    else {
        if(this.is_debug) {
            this.log("Commands like '"+iter.get()+"' currently are not supported for more complicated parameter sequences.");
        }
    }

    return undefined;
}
//----------------------------------------------------------------------------------------
Parser.prototype.handle_param_specific = function(iter, bits) {
    // Map each value to a unique permutation.
    var value = characters.char_to_int(iter.get());

    // There are 128 different combinations.
    var cmp = 0;

    // 0
    if(value === cmp++) {
        this.add_param(new Reference(this.regs, 0));
    }
    // 1
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }
    // 2
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 2));
    }
    //------------------------------------------------------------------------------------
    // 00
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 0));
        this.add_param(new Reference(this.regs, 0));
    }
    // 01
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 0));
        this.add_param(new Reference(this.regs, 1));
    }
    // 02
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 0));
        this.add_param(new Reference(this.regs, 2));
    }
    // 10
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
        this.add_param(new Reference(this.regs, 0));
    }
    // 11
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
        this.add_param(new Reference(this.regs, 1));
    }
    // 12
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
        this.add_param(new Reference(this.regs, 2));
    }
    // 20
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 2));
        this.add_param(new Reference(this.regs, 0));
    }
    // 21
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }
    // 22
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }

    //------------------------------------------------------------------------------------
    // 012
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }
    // 021
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }
    // 102
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }
    // 120
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }
    // 201
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }
    // 210
    else if(value === cmp++) {
        this.add_param(new Reference(this.regs, 1));
    }

    else {
        if(this.is_debug) {
            this.log("The character '" + iter.get() + "' is not supported as parameter sequence code.");
        }
        return undefined;
    }
    return iter;
}
//////////////////////////////////////////////////////////////////////////////////////////


//----------------------------------------------------------------------------------------
global.Parser = Parser;
global.Parser.char_iter = char_iter;


})(this, this.characters, this.NUMBER, this.STRING, this.ARRAY, this.stdout, this.stdin, this.Reference);
