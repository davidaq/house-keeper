
class FormContext {
    constructor(defaultVal) {
        this.value = defaultVal || {};
        this.errors = {};
        this.children = {};
    }
    setValue(key, val) {
        var item = trace(this.value, key, true);
        item.obj[item.key] = val;
        item = trace(this.errors, key);
        if (item) {
            delete item.obj[item.key];
        }
        this.signal();
    }
    getValue(key, defaultVal) {
        var hasDefault = typeof defaultVal != 'undefined';
        var item = trace(this.value, key, hasDefault);
        if (!item || !item.exists) {
            if (hasDefault) {
                item.obj[item.key] = defaultVal;
            }
            return defaultVal;
        }
        return item.obj[item.key];
    }
    handleChange(key, callback) {
        return event => {
            var value = event.target.value;
            if (typeof callback == 'function') {
                try {
                    var newValue = callback(value);
                    if (typeof newValue != 'undefined')
                        value = newValue;
                } catch(error) {
                    if (typeof error == 'string') {
                        this.setError(key, error);
                        return;
                    } else
                        throw error;
                }
            }
            this.setValue(key, value);
        };
    }
    setError(key, val) {
        var item = trace(this.errors, key, true);
        if (typeof val == 'undefined') {
            delete item.obj[item.key];
        } else {
            item.obj[item.key] = val;
        }
        this.signal();
    }
    getError(key) {
        var item = trace(this.errors, key);
        if (item)
            return item.obj[item.key];
    }
    signal() {
        if (typeof this.onChange == 'function') {
            this.onChange({target:this});
        }
    }
    mixin(key, defaultVal, callback) {
        return {
            value: this.getValue(key, defaultVal),
            onChange: this.handleChange(key, callback)
        }
    }
    bind(target, key) {
        if (target instanceof FormContext) {
            if (key)
                this.onChange = target.handleChange(key);
            else
                throw new Error('Must provide a key');
        } else if (typeof target.forceUpdate == 'function') {
            if (key) {
                this.onChange = () => target.forceUpdate();
            } else {
                this.onChange = event => target.setState({[key]:event.target.value})
            }
        } else if (typeof target == 'string') {
            if (this.children[target]) {
                var child = new FormContext(key);
                this.children[target] = child;
                child.bind(this, target);
            }
            return this.children[target];
        }
        return this;
    }
    alert(key, type='danger') {
        return <div if={this.getError(key)} className={"alert alert-" + type}>
            <a className="close" onClick={() => this.setError(key)}><span aria-hidden="true">&times;</span></a>
            {this.getError(key)}
        </div>
    }
}

function trace(obj, path, forceExists) {
    path = path.split('.');
    if (!path.length)
        throw new Error('Empty key is not allowed');
    for (var i = 0; i < path.length - 1; i++) {
        var key = path[i];
        if (key in obj) {
            obj = obj[key];
        } else if (forceExists && i < path.length) {
            var nextKey = path[i + 1];
            if (isFinite(nextKey) && nextKey - 0 >= 0) {
                obj[key] = [];
            } else {
                obj[key] = {};
            }
        } else {
            return null;
        }
    }
    var key = path.pop();
    return {
        obj,
        key,
        exists: key in obj
    };
}

export default FormContext;