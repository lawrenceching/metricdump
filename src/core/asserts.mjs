import assert from 'assert';


export function isString(actual) {
    return typeof actual !== 'string' && !(actual instanceof String)
}

export function isNotBlank(actual) {
    return actual === undefined || actual === null || !isString(actual) || actual.length === 0;
}

export function isNumber(str) {
    for (let i = 0; i < str.length; i++) {
        const c = str.charAt(i)
        if(c < '0' || c > '9') {
            return false;
        }
    }
}

export function isOneOf(actual, array) {
    for(const i of array) {
        if(actual === i) {
            return true;
        }
    }
    return false;
}
function assertThat(actual) {
    return {
        isString() {
            if (!isString(actual)) {
                assert.fail(`Expect "${actual}" to be String but it's ${typeof actual}`)
            }
        },
        isNotBlank() {
            if (!isNotBlank(actual)) {
                assert.fail(`Expect "${actual}" is not blank`)
            }
        },
        isOneOf(array) {
            if(!isOneOf(actual, array)) {
                assert.fail(`Expected "${actual}" to be one of ${JSON.stringify(array)}`)
            }
        }
    }
}

export {assertThat}