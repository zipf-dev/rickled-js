class BaseRickle {

    constructor(base = null, deep = false, strict = true, initArgs = {}) {
        this.__metaInfo = {};
        this.__strict = strict;
        let stringed = '';

        if (base === null) {
            return;
        }

        if (typeof base === 'object' && !Array.isArray(base)) {
            this.internalize(base, deep, initArgs);
            return;
        }

        if (typeof base === 'string') {
            try {
                // Test if URL and try loading ressponse data
                fetch(base).then(response => response.json()).then(dictData => {
                    this.internalize(dictData, deep, initArgs);
                });
                return;
            } catch (e) {
                console.info("Tried interpreting as URL:", e);
            }

            stringed = base; // Assuming base is a string representation of JSON/YAML

            // Add initArgs 
            Object.keys(initArgs).forEach(k => {
                const placeholder = `_|${k}|_`;
                stringed = stringed.replace(placeholder, JSON.stringify(initArgs[k]));
            });

            try {
                // Try loading asJSON
                const dictData = JSON.parse(stringed);
                this.internalize(dictData, deep, initArgs);
                return;
            } catch (e) {
                console.info("Tried interpreting as JSON string:", e);
            }

            // Add YAML parsing if needed, depending on availability in the environment
        }

        throw new Error(`Base object could not be internalized, type ${typeof base} not handled and could not be interpreted`);
    }

    internalize(dictionary, deep, initArgs) {
        Object.entries(dictionary).forEach(([k, v]) => {
            this.checkKw(k);
            if (typeof v === 'object' && !Array.isArray(v)) {
                this[k] = new BaseRickle(v, deep, this.__strict, initArgs);
            } else if (Array.isArray(v) && deep) {
                const newList = v.map(i => typeof i === 'object' ? new BaseRickle(i, deep, this.__strict, initArgs) : i);
                this[k] = newList;
            } else {
                this[k] = v;
            }
        });
    }

    get(key, defaultValue = undefined) {
        return this.hasOwnProperty(key) ? this[key] : defaultValue;
    }

    set(key, value) {
        if (key.includes('/') && !key.startsWith('/')) {
            throw new Error('Missing root path /');
        }
        if (!key.includes('/')) {
            key = `/${key}`;
        }

        if (key === '/') {
            throw new Error('Cannot set a value to self');
        }

        const pathList = key.split('/');

        let currentNode = this;

        for (let i = 1; i < pathList.length - 1; i++) {
            if (typeof currentNode[pathList[i]] === 'undefined' || currentNode[pathList[i]] === null) {
                throw new Error(`The path ${key} could not be traversed`);
            }
            currentNode = currentNode[pathList[i]];
        }

        if (pathList[pathList.length - 1].includes('?')) {
            throw new Error(`Function params "${pathList[pathList.length - 1]}" included in path!`);
        }

        currentNode[pathList[pathList.length - 1]] = value;
    }

    checkKw(name) {
        if (this.__strict && (name in this)) {
            throw new Error(`Unable to add key '${name}', reserved keyword in Rickle. Use strict=False.`);
        }
    }

    toJsonString(serialized = true) {
        // Assuming a method exists to convert the instance into a dictionary-like object, minus functions
        const selfAsDict = this.toDict(serialized);
        return JSON.stringify(selfAsDict);
    }

    addAttr(name, value) {
        // Check if the name is a reserved keyword or already used property name
        this.checkKw(name);

        // Add or update the property with the new value
        this[name] = value;

        // Update the __metaInfo object with the new attribute's information
        if (!this.__metaInfo) {
            this.__metaInfo = {};
        }
        this.__metaInfo[name] = { type: 'attr', value: value };
    }

    toDict(serialized = false) {
        const dict = {};
        for (const [key, value] of Object.entries(this)) {
            // Check if thiss is a underlying member (hidden)
            if (key.startsWith('__') || key.endsWith('__metaInfo')) continue;
            if (value instanceof BaseRickle) {
                // Recursively serialize BaseRickle instances
                dict[key] = value.toDict(serialized);
            } else if (Array.isArray(value)) {
                // Handle arrays, including arrays of BaseRickle instances
                const newList = value.map(element => element instanceof BaseRickle ? element.toDict(serialized) : element);
                dict[key] = newList;
            } else {
                // Directly assign other values
                dict[key] = value;
            }
        }
        return dict;
    }
}

module.exports = { BaseRickle: BaseRickle };