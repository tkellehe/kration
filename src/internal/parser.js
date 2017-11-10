(function(global, characters, NUMBER, STRING, stdout, stdin){


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

//----------------------------------------------------------------------------------------
function Parser(code) {
    this.props = { };
    this.regs = [new NUMBER(0), new STRING(""), new STRING("Hello, World!")];
    this.params = [];
    this.ops = [];
    this.look_up = {};

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
Parser.prototype.parse_params = function() {
    for(var iter = new char_iter(this.reg_code); iter; iter = iter && iter.next()) {
        var bits = characters.bitify_char(iter.get());
        if(bits[0]) {
            // Special command for processing bits.
            iter = undefined;
        } else {
            // Param specific command.
            iter = this.handle_param_specific(iter, bits);
        }
    }
}
//----------------------------------------------------------------------------------------
Parser.prototype.handle_param_specific = function(iter, bits) {
    if(bits[1]) {
        return undefined;
    } else {
        if(bits[2]) {
            this.params.unshift(0);
        }
        if(bits[3]) {
            this.params.unshift(1);
        }
        if(bits[4]) {
            this.params.unshift(2);
        }
        if(bits[5]) {
            this.params.unshift(0);
        }
        if(bits[6]) {
            this.params.unshift(1);
        }
        if(bits[7]) {
            this.params.unshift(2);
        }
    }
    return iter;
}
//////////////////////////////////////////////////////////////////////////////////////////


//----------------------------------------------------------------------------------------
global.Parser = Parser;
global.Parser.char_iter = char_iter;


})(this, this.characters, this.NUMBER, this.STRING, this.stdout, this.stdin);
