(function(global, characters){


//----------------------------------------------------------------------------------------
function STRING(obj) {
    this.type = "STRING";
    this.is_kration_type = true;
    this.value = obj === undefined ? "" :
        (obj.is_kration_type ? obj.to_string() :
            (typeof obj === "string" ? obj : ""));
    this.value = characters.fix_string(this.value);
    this.props = {};
}


//////////////////////////////////////////////////////////////////////////////////////////
/// These functions return the most primitive representation of the type.
//----------------------------------------------------------------------------------------
STRING.prototype.to_string = function() {
    return this.value.toString.apply(this.value, Array.prototype.slice.call(arguments));
}


//----------------------------------------------------------------------------------------
STRING.prototype.to_number = function() {
    arr = Array.prototype.slice.call(arguments);
    arr.unshift(this.value);
    return parseFloat.apply(global, arr);
}


//----------------------------------------------------------------------------------------
STRING.prototype.to_array = function() {
    return characters.char_array(this.value);
}
//////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////////////
/// These are operations that can be done to the Noodel types.
//----------------------------------------------------------------------------------------
STRING.prototype.ith_item = function(i) {
    return new STRING(this.value[i]);
}


//----------------------------------------------------------------------------------------
STRING.prototype.flip = function() {
    return new STRING(characters.reverse_string(this.value));
}
//////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////////////
/// These functions are basic operators that can be used with other Noodel types.
//----------------------------------------------------------------------------------------
STRING.prototype.add_item_onto_the_right = function(item) {
    return new STRING(this.value + item.to_string());
}


//----------------------------------------------------------------------------------------
STRING.prototype.add_item_onto_the_left = function(item) {
    return new STRING(item.to_string() + this.value);
}


//----------------------------------------------------------------------------------------
STRING.prototype.remove_item_from_the_right = function(item) {
    // This is done such that is removed in the same as the item.
    return new STRING(characters.reverse_string(characters.reverse_string(this.value).replace(characters.reverse_string(item.to_string()), "")));
}


//----------------------------------------------------------------------------------------
STRING.prototype.remove_item_from_the_left = function(item) {
    return new STRING(this.value.replace(item.to_string(), ""));
}
//////////////////////////////////////////////////////////////////////////////////////////


//----------------------------------------------------------------------------------------
global.STRING = STRING;


})(this, this.characters);
