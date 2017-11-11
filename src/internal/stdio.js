(function(global, characters, NUMBER, STRING){


//----------------------------------------------------------------------------------------
var stdout = {__content__: ""};
var stdin = {__content__: []};


//////////////////////////////////////////////////////////////////////////////////////////
/// These functions write out to the output file.
//----------------------------------------------------------------------------------------
stdout.write = function() {
    for(var i = 0, l = arguments.length; i < l; ++i) {
        var s = "";
        var obj = arguments[i];
        if(obj !== undefined && obj.is_kration_type) {
            s = obj.to_string();
        } else {
            s = obj+"";
        }

        stdout.__content__ = characters.insert_string(stdout.__content__, stdout.__loc__, s);
        stdout.__loc__ += s.length
    }
}
//----------------------------------------------------------------------------------------
stdout.clear = function() {
    stdout.__content__ = "";
    stdout.__loc__ = 0;
}
//----------------------------------------------------------------------------------------
stdout.__loc__ = 0;
//////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////////////
/// These functions write out to the read from input file and query.
//----------------------------------------------------------------------------------------
stdin.read = function() {
    var popped = undefined;
    if(!stdin.__content__.length) {
        stdin.get_user_input();
    }
    popped = stdin.__content__.shift();
    return popped;
}
//----------------------------------------------------------------------------------------
stdin.get_user_input = function(msg, type, def) {
    var input;
    if(arguments.length === 3) {
        input = prompt(msg, def);
    } else {
        input = prompt(msg);
    }

    if(type === "STRING") {
        input = new STRING(input);
    } else if(type === "NUMBER") {
        input = new NUMBER(new STRING(input));
    } else {
        input = new STRING(input);
    }

    stdin.__content__.unshift(input);
}
//////////////////////////////////////////////////////////////////////////////////////////


//----------------------------------------------------------------------------------------
global.stdout = stdout;
global.stdin = stdin;


})(this, this.characters, this.NUMBER, this.STRING);
