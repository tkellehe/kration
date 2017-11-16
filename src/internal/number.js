(function(global, characters){


//----------------------------------------------------------------------------------------
function NUMBER(obj) {
    this.type = "NUMBER";
    this.is_kration_type = true;
    if(obj === undefined) {
        obj = 0;
    } else if(obj.is_kration_type) {
        obj = obj.to_number();
    } else if(typeof obj !== "number") {
        obj = 0;
    }
    this.value = obj !== obj ? 0 : obj;
    this.props = {};
}


//////////////////////////////////////////////////////////////////////////////////////////
/// These functions return the most primitive representation of the type.
//----------------------------------------------------------------------------------------
NUMBER.prototype.to_string = function() {
    return this.value.toString.apply(this.value, Array.prototype.slice.call(arguments));
}


//----------------------------------------------------------------------------------------
NUMBER.prototype.to_number = function() {
    // Problem with converting to a number...
    return this.value.valueOf.apply(this.value, Array.prototype.slice.call(arguments));
}


//----------------------------------------------------------------------------------------
NUMBER.prototype.to_array = function() {
    return [this.value];
}
//////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////////////
/// These are operations that can be done to the Noodel types.
//----------------------------------------------------------------------------------------
NUMBER.prototype.ith_item = function(i) {
    var s = this.to_string().replace("-", "").replace(".", "");
    return new NUMBER(+s[i]);
}


//----------------------------------------------------------------------------------------
NUMBER.prototype.flip = function() {
    return new NUMBER(-this.value);
}
//////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////////////
/// These functions are basic operators that can be used with other Noodel types.
//----------------------------------------------------------------------------------------
NUMBER.prototype.add_item_onto_the_right = function(item) {
    return new NUMBER(this.value + item.to_number());
}


//----------------------------------------------------------------------------------------
NUMBER.prototype.add_item_onto_the_left = function(item) {
    return new NUMBER(item.to_number() + this.value);
}


//----------------------------------------------------------------------------------------
NUMBER.prototype.remove_item_from_the_right = function(item) {
    // This is done such that is removed in the same as the item.
    return new NUMBER(this.value - item.to_number());
}


//----------------------------------------------------------------------------------------
NUMBER.prototype.remove_item_from_the_left = function(item) {
    return new NUMBER(this.item.to_number() - this.value);
}
//////////////////////////////////////////////////////////////////////////////////////////


//----------------------------------------------------------------------------------------
global.NUMBER = NUMBER;


})(this, this.characters);
