
class FormContext {
    constructor(defaultVal) {
        this.value = defaultVal || {};
        this.errors = {};
        this.children = {};
        this.changing = '';
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
            this.changing = key;
            this.setValue(key, value);
        };
    }
    setError(key, val) {
        if (typeof val == 'undefined') {
            var item = trace(this.errors, key);
            if (!item)
                return;
            delete item.obj[item.key];
        } else {
            var item = trace(this.errors, key, true);
            item.obj[item.key] = val;
        }
        this.signal();
    }
    getError(key) {
        var item = trace(this.errors, key);
        if (item)
            return item.obj[item.key];
    }
    hasError() {
        return this._hasError(this.errors);
    }
    _hasError(errors) {
        if (!errors) {
            return false;
        }
        if (typeof errors == 'object') {
            for (var v of errors) {
                if (this._hasError(v)) {
                    return true;
                }
            }
        } else {
            return true;
        }
    }
    signal() {
        if (typeof this.onChange == 'function') {
            this.onChange({target:this});
        }
    }
    mixin(key, defaultVal, callback) {
        return {
            value: this.getValue(key, defaultVal),
            onChange: this.handleChange(key, callback),
            isChanging: this.changing == key
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
        var msg = this.getError(key);
        if (msg && typeof msg == 'object' && msg.type && msg.message) {
            type = msg.type;
            msg = msg.message;
        }
        if (Array.isArray(msg)) {
            msg = msg.map(v => v + ' ');
            msg[0] = <strong key={0}>{msg[0]}</strong>;
        }
        return <div if={msg} className={"alert alert-" + type}>
            <a className="close" onClick={() => this.setError(key)}><span aria-hidden="true">&times;</span></a>
            {msg}
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
        } else if (forceExists) {
            var nextKey = path[i + 1];
            if (isFinite(nextKey) && nextKey - 0 >= 0) {
                obj[key] = [];
            } else {
                obj[key] = {};
            }
            obj = obj[key];
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