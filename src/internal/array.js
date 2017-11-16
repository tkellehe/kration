(function(global, characters, STRING, ARRAY){


//----------------------------------------------------------------------------------------
function ARRAY(obj) {
    this.type = "ARRAY";
    this.is_kration_type = true;
    this.value = obj === undefined ? [] :
        (obj.is_kration_type ? obj.to_array() :
            (typeof obj === "object" && obj instanceof Array ? obj : []));
    this.props = {};
}


//////////////////////////////////////////////////////////////////////////////////////////
/// These functions return the most primitive representation of the type.
//----------------------------------------------------------------------------------------
function TO_STRING(obj) {
    if(typeof obj === "object" && obj instanceof Array) {
        var s = "[";
        if(obj.length) {
            s += TO_STRING(obj[0]);
            for(var i = 1, l = obj.length; i < l; ++i) {
                s += ", " + TO_STRING(obj[i]);
            }
        }
        s += "]";
        return s;
    } else if(obj === undefined) {
        return "undefined";
    } else if(obj.is_kration_type) {
        return obj.to_string();
    } else if(typeof obj === "string") {
        return '"' + obj + '"';
    } else {
        return obj.toString();
    }
}

ARRAY.prototype.to_string = function() {
    return TO_STRING(this.value);
}


//----------------------------------------------------------------------------------------
function TO_NUMBER(obj) {
    if(typeof obj === "object" && obj instanceof Array) {
        var s = 0;
        for(var i = 0, l = obj.length; i < l; ++i) {
            s += TO_NUMBER(obj[i]);
        }
        return s;
    } else if(obj === undefined) {
        return 0;
    } else if(obj.is_kration_type) {
        return obj.to_number();
    } else {
        var result = +obj;
        if(typeof result !== "number" || result === NaN) {
            result = 0
        }
        return result;
    }
}


ARRAY.prototype.to_number = function() {
    return TO_NUMBER(this.value);
}


//----------------------------------------------------------------------------------------
ARRAY.prototype.to_array = function() {
    return this.value;
}
//////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////////////
/// These are operations that can be done to the Noodel types.
//----------------------------------------------------------------------------------------
ARRAY.prototype.ith_item = function(i) {
    var item = this.value;
    if(item === undefined) {
        return new ARRAY();
    } else if(item.is_kration_type) {
        return item;
    } else if(typeof item === "object" && item instanceof Array) {
        return new ARRAY(item);
    } else if(typeof item === "number") {
        return new NUMBER(item);
    } else if(typeof item === "string") {
        return new STRING(item);
    }
    return new ARRAY();
}


//----------------------------------------------------------------------------------------
ARRAY.prototype.flip = function() {
    this.value = this.value.reverse();
    return this;
}
//////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////////////
/// These functions are basic operators that can be used with other Noodel types.
//----------------------------------------------------------------------------------------
ARRAY.prototype.add_item_onto_the_right = function(item) {
    if(item.is_kration_type) {
        item = item.value;
    }
    this.value.push(item);
    return this;
}


//----------------------------------------------------------------------------------------
ARRAY.prototype.add_item_onto_the_left = function(item) {
    if(item.is_kration_type) {
        item = item.value;
    }
    this.value.unshift(item);
    return this;
}


//----------------------------------------------------------------------------------------
ARRAY.prototype.remove_item_from_the_right = function(item) {
    for(var i = this.value.length; i--;) {
        if(item === this.value[i]) {
            this.value.splice(i, 1);
            return this;
        }
    }
    return this;
}


//----------------------------------------------------------------------------------------
ARRAY.prototype.remove_item_from_the_left = function(item) {
    for(var i = 0, l = this.value.length; i < l; ++i) {
        if(item === this.value[i]) {
            this.value.splice(i, 1);
            return this;
        }
    }
    return this;
}
//////////////////////////////////////////////////////////////////////////////////////////


//----------------------------------------------------------------------------------------
global.ARRAY = ARRAY;


})(this, this.characters, this.STRING, this.NUMBER);
