/**
 * Code for shamir secret sharing
 */
const assert = require('assert');
// const { BigNumber } = require('bignumber.js'); // ! not needed
const crypto = require('crypto');
// const expr_eval = require('expr-eval') // ! not needed
const randBigInt = require('random-bigint')


// const parser = new expr_eval.Parser() // ! doesn't work for big int

// * own evaluation for expression

class Polynomial {
    constructor(secret, degree, modPrime) {
        this.degree = degree
        this.coeff = this.#initRandomCoefficients(secret)
        this.modPrime = modPrime
    }

    /**
     * 
     * @param {BigInt} secret c_0 of the polynomial
     */

    #initRandomCoefficients(secret) {
        // creating a polynomial
        let coeff = [secret]

        for (let i = 1; i <= this.degree; i++) {
            let number = randBigInt(128)
            while (coeff.includes(number) || number > this.modPrime) {
                number = randBigInt(128)
            }
            coeff.push(number)
        }

        return coeff
    }

    /**
     * to evaluate the polynomial at x
     * @param {BigInt} x to evaluate
     * @returns {BigInt} evaluation at x
     */
    evaluate(x) {
        let evl = this.coeff[0]
        let xsq = 1n

        for (let i = 1; i < this.coeff.length; i++) {
            xsq *= x
            evl += xsq * this.coeff[i]
        }

        return evl % this.modPrime
    }

}


class CreateShamirSecret {

    /**
     * 
     * @param {BigInt} secret the secret to be divided up (send '0' for random input)
     * @param {Number} numMinKeys the number of minimum keys required to generate the secret
     */
    constructor(secret, numMinKeys, keysToGenerate) {

        // testing if the secret is less than or of size 8, keeping key size less than 64 bits
        assert.strictEqual(secret.length <= 8, true)
        // testing if minimum keys to create secret is less than the number of keys to generate
        assert.equal(parseInt(numMinKeys) <= parseInt(keysToGenerate), true)

        this.secret = secret != '0' ? this.#convertSecretToInt(secret) : this.#generateRandSec();     // converting secret to an integer

        this.modPrime = this.secret - 1n     // generating a prime for mod
        while (this.modPrime < this.secret) {
            this.modPrime = this.#getRand128BitPrime()
        }

        this.numMinKeys = numMinKeys;
        this.polynomial = this.#createPolynomial()
        this.keysToGenerate = keysToGenerate
    }

    /**
     * Converts secret to integer
     * @returns {number}
     */

    #convertSecretToInt(secret) {
        let hexStr = "";
        for (let i = 0; i < secret.length; i++) {
            hexStr += secret.charCodeAt(i).toString(16)
        }

        return BigInt('0x' + hexStr)
    }

    /**
     * Returns a prime number of 128 bits
     * @returns {number} a prime of 128 bits
     */
    #getRand128BitPrime() {
        return crypto.generatePrimeSync(128, { bigint: true })
    }

    /**
     * Generate a random secret key of size of 64 bits
     */
    #generateRandSec() {
        const k = crypto.generateKeySync('hmac', { length: 64 })
        var sKey = k.export().toString('hex')
        return BigInt('0x' + sKey)
    }

    /**
     * creates a polynomial
     * @returns {expr_eval.Parser}
     */
    #createPolynomial() {
        return new Polynomial(this.secret, this.numMinKeys - 1, this.modPrime)
    }

    getKeyShares() {
        // create points for secret generation
        let i = 1
        let randDomain = []

        while (i <= this.keysToGenerate) {
            let number = randBigInt(128)

            if (!randDomain.includes(number) && number != 0n && number < this.modPrime) {
                randDomain.push(number)
                i += 1
            }
        }

        console.log('The polynomial will be evaluated at points: ' + randDomain.toString())

        let keysGenr = []
        for (i of randDomain) {
            keysGenr.push([i, (this.polynomial.evaluate(i)), this.modPrime])
        }

        return keysGenr;
    }

}


class DecodeShamirSecret {
    /**
     * @constructor
     * @param {Array} keys will be in the form [x, y, prime mod]
     */
    constructor(keys) {
        this.keys = keys
        //this.intplValue = new BigNumber(0)
        this.modPrime = keys[0][2]
        this.secret = undefined
    }

    /**
     * Converts integer into the secret
     * @param {string} hexStr secret that has been converted to hex string
     * @returns {string} returns secret from given integer
     */
    #convertIntToSecret(num) {
        let str = num.toString(16)

        let secret = ''
        for (let i = 0; i <= str.length; i += 2) {
            secret += String.fromCharCode(parseInt(str.substring(i, i + 2), 16));
        }

        return secret.slice(0, secret.length - 1)
    }

    /**
     * To perform truncate division on javascript big int
     */
    #truncateDiv(a, b) {
        let t = a / b
        if (b * t > a) {
            t -= 1n
        }
        return t
    }

    /**
     * To calculate the bezout's coefficients of two number
     * @param {Number} a 
     * @param {Number} b 
     * @returns {[Number, Number]} returns bezout coefficients x & y
     */
    #extendedEuclidean(a, b) {
        let x = 0n
        let lst_x = 1n
        let y = 1n
        let lst_y = 0n

        while (b != 0) {
            let quot = this.#truncateDiv(a, b)
            let tmp = a
            a = b
            b = ((tmp % b) + b) % b

            tmp = x
            x = lst_x - quot * x
            lst_x = tmp

            tmp = y
            y = lst_y - quot * y
            lst_y = tmp
        }

        return [lst_x, lst_y]
    }

    #divMod(num, den) {
        const [x, _] = this.#extendedEuclidean(den, this.modPrime)
        return x * num
    }

    #multValues(values) {
        let val = 1n
        for (let i of values) {
            val *= i
        }
        return val
    }

    /**
     * will interpolate and create a polynomial using BigNumber
     * use python script to run scipy lagrange interpolation
     */
    lagrangeInterpolate() {

        /* implementation using big-number js
        let secArray = []
        for (let i = 0; i < this.keys.length; i++) {
            let val = new BigNumber(1)
            console.log("=== starting ===")

            for (let j = 0; j < this.keys.length; j++) {
                if (i == j) {
                    continue
                }
                let xm = this.keys[j][0]
                xm = new BigNumber(xm.toString())       // converting to BigNumber
                let num = xm.times(-1)
                console.log("num: " + xm.toString())

                let d1 = this.keys[i][0]
                d1 = new BigNumber(d1.toString())
                let denom = d1.minus(xm)
                console.log("denom: " + denom.toString())

                let quo = num.dividedBy(denom)
                console.log("quo: " + denom.toString())

                val = val.times(quo)
                console.log("value: " + val.toString())

            }
            val = val.times(new BigNumber(this.keys[i][1].toString()))
            secArray.push(val)

            console.log("=== ending ===")
        }
        secArray.forEach(item => console.log(item.toString()))
        secArray.forEach(value => { this.intplValue = this.intplValue.plus(value) })
        */

        // implementing using divMod
        let nums = []
        let denoms = []

        for (let i = 0; i < this.keys.length; i++) {
            let cur = this.keys[i][0]
            let numMult = this.#multValues(this.keys.map(item => -item[0]))
            nums.push(numMult / (-cur)) // multiply all values except current

            let denomsT = this.keys.filter((_, index) => index != i)
            denomsT = denomsT.map(item => cur - item[0]) // all values except current)

            let denomMult = this.#multValues(denomsT)
            denoms.push(denomMult)
        }

        //let den = this.#multValues(denoms)  // multiply all denominators

        let num = 0n
        let toSum = nums.map((item, index) => {
            let y = this.keys[index][1]
            //let numerator = (((item * den * y) % this.modPrime) + this.modPrime) % this.modPrime
            let numerator = (((item * y) % this.modPrime) + this.modPrime) % this.modPrime
            return this.#divMod(numerator, denoms[index])
        })

        toSum.forEach(item => num += item)
        // return ((this.#divMod(num, den) % this.modPrime) + this.modPrime) % this.modPrime
        return ((num % this.modPrime) + this.modPrime) % this.modPrime

    }

    getSecret() {
        const biSecret = this.lagrangeInterpolate()
        this.secret = biSecret
        return this.#convertIntToSecret(this.secret)
    }
}

// const e = new DecodeShamirSecret([[1n, 6n, 31n], [2n, 16n, 31n], [3n, 26n, 31n]])
// v = e.divMod(18n, -1n)
// console.log(v)

module.exports = {
    CreateShamirSecret,
    DecodeShamirSecret
}