(function(global){

//----------------------------------------------------------------------------------------
function Reference(context, prop) {
    this.is_reference_type = true;

    this.get = function() { return this.context[this.prop]; }
    this.set = function(v) { this.context[this.prop] = v; }

    this.point_to = function(context, prop) {
        if(context === undefined || context === null) {
            this.is_null = true;
            this.context = undefined;
            this.prop = prop;
        } else {
            if(context.is_reference_type) {
                this.is_null = context.is_null;
                this.context = context.context;
                this.prop = prop;
            } else {
                this.is_null = false;
                this.context = context;
                this.prop = prop;
            }
        }
    }

    this.point_to(context, prop);
    
    this.copy = function() { 
        return new Reference(this.context, this.prop);
    };
}

//----------------------------------------------------------------------------------------
global.Reference = Reference;

})(this);
