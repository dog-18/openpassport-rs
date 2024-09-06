"use strict";
// Copied from zk-email cuz it uses crypto so can't import it here.
Object.defineProperty(exports, "__esModule", { value: true });
exports.shaPad = shaPad;
exports.sha1Pad = sha1Pad;
exports.sha256Pad = sha256Pad;
exports.int64toBytes = int64toBytes;
exports.mergeUInt8Arrays = mergeUInt8Arrays;
exports.int8toBytes = int8toBytes;
exports.assert = assert;
function shaPad(signatureAlgorithm, prehash_prepad_m, maxShaBytes) {
    if (signatureAlgorithm == 'sha1WithRSAEncryption') {
        return sha1Pad(prehash_prepad_m, maxShaBytes);
    }
    else {
        return sha256Pad(prehash_prepad_m, maxShaBytes);
    }
}
// Puts an end selector, a bunch of 0s, then the length, then fill the rest with 0s.
function sha1Pad(prehash_prepad_m, maxShaBytes) {
    let length_bits = prehash_prepad_m.length * 8; // bytes to bits
    let length_in_bytes = int64toBytes(length_bits);
    prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int8toBytes(2 ** 7)); // Add the 1 on the end, length 505
    while ((prehash_prepad_m.length * 8 + length_in_bytes.length * 8) % 512 !== 0) {
        prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int8toBytes(0));
    }
    prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, length_in_bytes);
    assert((prehash_prepad_m.length * 8) % 512 === 0, "Padding did not complete properly!");
    let messageLen = prehash_prepad_m.length;
    while (prehash_prepad_m.length < maxShaBytes) {
        prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int64toBytes(0));
    }
    assert(prehash_prepad_m.length === maxShaBytes, `Padding to max length did not complete properly! Your padded message is ${prehash_prepad_m.length} long but max is ${maxShaBytes}!`);
    return [prehash_prepad_m, messageLen];
}
// Puts an end selector, a bunch of 0s, then the length, then fill the rest with 0s.
function sha256Pad(prehash_prepad_m, maxShaBytes) {
    let length_bits = prehash_prepad_m.length * 8; // bytes to bits
    let length_in_bytes = int64toBytes(length_bits);
    prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int8toBytes(2 ** 7)); // Add the 1 on the end, length 505
    while ((prehash_prepad_m.length * 8 + length_in_bytes.length * 8) % 512 !== 0) {
        prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int8toBytes(0));
    }
    prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, length_in_bytes);
    assert((prehash_prepad_m.length * 8) % 512 === 0, "Padding did not complete properly!");
    let messageLen = prehash_prepad_m.length;
    while (prehash_prepad_m.length < maxShaBytes) {
        prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int64toBytes(0));
    }
    assert(prehash_prepad_m.length === maxShaBytes, `Padding to max length did not complete properly! Your padded message is ${prehash_prepad_m.length} long but max is ${maxShaBytes}!`);
    return [prehash_prepad_m, messageLen];
}
// Works only on 32 bit sha text lengths
function int64toBytes(num) {
    let arr = new ArrayBuffer(8); // an Int32 takes 4 bytes
    let view = new DataView(arr);
    view.setInt32(4, num, false); // byteOffset = 0; litteEndian = false
    return new Uint8Array(arr);
}
function mergeUInt8Arrays(a1, a2) {
    // sum of individual array lengths
    var mergedArray = new Uint8Array(a1.length + a2.length);
    mergedArray.set(a1);
    mergedArray.set(a2, a1.length);
    return mergedArray;
}
// Works only on 32 bit sha text lengths
function int8toBytes(num) {
    let arr = new ArrayBuffer(1); // an Int8 takes 4 bytes
    let view = new DataView(arr);
    view.setUint8(0, num); // byteOffset = 0; litteEndian = false
    return new Uint8Array(arr);
}
function assert(cond, errorMessage) {
    if (!cond) {
        throw new Error(errorMessage);
    }
}
