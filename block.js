/**
 *                          Block class
 *  The Block class is a main component into any Blockchain platform, 
 *  it will store the data and act as a dataset for your application.
 *  The class will expose a method to validate the data... The body of
 *  the block will contain an Object that contain the data to be stored,
 *  the data should be stored encoded.
 *  All the exposed methods should return a Promise to allow all the methods 
 *  run asynchronous.
 */

const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii');

class Block {

    // Constructor - argument data will be the object containing the transaction data
	constructor(data){
		this.hash = null;                                           // Hash of the block
		this.height = 0;                                            // Block Height (consecutive number of each block)
        this.body = Buffer(JSON.stringify(data)).toString('hex');   // Contains information about the star discoverer's address:timestamp:the star object
		this.time = 0;                                              // Timestamp for the Block creation
		this.previousBlockHash = null;                              // Reference to the previous Block Hash
    }
    
    /**
     *  validate() method will validate if the block has been tampered or not.
     *  Been tampered means that someone from outside the application tried to change
     *  values in the block data as a consecuence the hash of the block should be different.
     *  Steps:
     *  1. Return a new promise to allow the method be called asynchronous.
     *  2. Save the in auxiliary variable the current hash of the block (`this` represent the block object)
     *  3. Recalculate the hash of the entire block (Use SHA256 from crypto-js library)
     *  4. Compare if the auxiliary hash value is different from the calculated one.
     *  5. Resolve true or false depending if it is valid or not.
     *  Note: to access the class values inside a Promise code you need to create an auxiliary value `let self = this;`
     */
    validate() {
        /*
         * Steps:
         * 1. Store the current hash of the block in a variable.let currentHash = self.hash.
         * 2. Make the hash of the block as null.self.hash = null.
         * 3. Calculate the hash value again and store it in a different variable.let newHash = SHA256(JSON.stringify(self)).toString()
         * 4. Assign the original hash value to the hash property of the block.self.hash = currentHash.
         * 5. Compare the currentHash and newHash.
        */
        let self = this;
        return new Promise((resolve, reject) => {
            
            // Save in auxiliary variable the current block hash
            let blockHash = self.hash;
            self.hash = null;

            /*/In case of Genesis Block, I think you need to do something with the previousBlockHash
            if (self.height == 0) {
                //let OriginalPreviousBlockHash = self.previousBlockHash;
                self.previousBlockHash = null;
            }*/
           
            // Recalculate the hash of the Block
            const recalculatedHash = SHA256(JSON.stringify(self)).toString();
            //Return the original hash back to the block to leave the block unchanged
            self.hash = blockHash;
            // Comparing if the hashes changed
            if (recalculatedHash == blockHash) {
                console.log('Block is valid');
                resolve(true);
            }

            // Returning the Block is valid
            else {
                // Returning the Block is not valid
                console.log('Block is not valid. Recalculated Hash is not the same as Block\'s Hash-\nOriginal Hash: ' + blockHash +
                    '\nRecalculated hash: ' + recalculatedHash);
                //reject('Block is not valid');
                resolve(false);
            }
            /*if (recalculatedHash !== self.hash) {
                // Returning the Block is not valid
                console.log('Block is not valid. Recalculated Hash is not the same as Block\'s Hash-\nOriginal Hash: ' + blockHash +
                    '\nRecalculated hash: ' + recalculatedHash);
                //reject('Block is not valid');
                resolve(false);
            }

            // Returning the Block is valid
            else {
                console.log('Block is valid');
                //resolve('Block is valid');
                resolve(true);
            }*/

        });
    }

    /**
     *  Auxiliary Method to return the block body (decoding the data)
     *  Steps:
     *  
     *  1. Use hex2ascii module to decode the data
     *  2. Because data is a javascript object use JSON.parse(string) to get the Javascript Object
     *  3. Resolve with the data and make sure that you don't need to return the data for the `genesis block` 
     *     or Reject with an error.
     */
    getBData() {

        //body definition:
        //this.body = Buffer(JSON.stringify(data)).toString('hex');   
        // Will contain the transactions stored in the block, by default it will encode the data

        // Getting the encoded data saved in the Block
        let self = this;

        // Decoding the data to retrieve the JSON representation of the object
        const decodedData = hex2ascii(self.body);

        // Parse the data to an object to be retrieve.
        const dataObj = JSON.parse(decodedData);
        // Resolve with the data if the object isn't the Genesis block
        //Resolve with the data and make sure that you don't need to return the data for the genesis block 
        //OR reject with an error.

        return new Promise((resolve, reject) => {
            if (dataObj.data != "Genesis Block") {
                console.log('Resolving getBData' + JSON.stringify(dataObj));
                resolve(dataObj);
            }
            else {
                console.log('Rejecting getBData');
                reject('Cannot return Genesis Block');
            }
            /*if (self.height > 0) {
                console.log('Resolving getBData' + JSON.stringify(dataObj));
                resolve(dataObj);
            }
            else {
                console.log('Rejecting getBData');
                reject('Cannot return Genesis Block');
            }*/

        });
    }

}

module.exports.Block = Block;                    // Exposing the Block class as a module

let b = new Block('Trying a new block');
/*b.getBData().then(block => {
    console.log(JSON.stringify(block))
}).catch(msg=>console.log(msg));*/

//b.validate().then(x => console.log(x)).catch(x => console.log(x));