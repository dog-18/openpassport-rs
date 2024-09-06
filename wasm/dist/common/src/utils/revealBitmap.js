"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revealBitmapFromMapping = revealBitmapFromMapping;
exports.revealBitmapFromAttributes = revealBitmapFromAttributes;
exports.unpackReveal = unpackReveal;
exports.formatAndUnpackReveal = formatAndUnpackReveal;
const constants_1 = require("../constants/constants");
function revealBitmapFromMapping(attributeToReveal) {
    const reveal_bitmap = Array(90).fill('0');
    Object.entries(attributeToReveal).forEach(([attribute, reveal]) => {
        if (reveal !== "") {
            const [start, end] = constants_1.attributeToPosition[attribute];
            reveal_bitmap.fill('1', start, end + 1);
        }
    });
    return reveal_bitmap;
}
function revealBitmapFromAttributes(attributeToReveal) {
    const reveal_bitmap = Array(90).fill('0');
    Object.entries(attributeToReveal).forEach(([attribute, reveal]) => {
        const [start, end] = constants_1.attributeToPosition[attribute];
        reveal_bitmap.fill('1', start, end + 1);
    });
    return reveal_bitmap;
}
function unpackReveal(revealedData_packed) {
    const bytesCount = [31, 31, 28]; // nb of bytes in each of the first three field elements
    const bytesArray = revealedData_packed.flatMap((element, index) => {
        const bytes = bytesCount[index];
        const elementBigInt = BigInt(element);
        const byteMask = BigInt(255); // 0xFF
        const bytesOfElement = [...Array(bytes)].map((_, byteIndex) => {
            return (elementBigInt >> (BigInt(byteIndex) * BigInt(8))) & byteMask;
        });
        return bytesOfElement;
    });
    return bytesArray.map((byte) => String.fromCharCode(Number(byte)));
}
function formatAndUnpackReveal(revealedData_packed) {
    const revealedData_packed_formatted = [
        revealedData_packed["revealedData_packed[0]"],
        revealedData_packed["revealedData_packed[1]"],
        revealedData_packed["revealedData_packed[2]"],
    ];
    return unpackReveal(revealedData_packed_formatted);
}
