"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRCodeGenerator = void 0;
const easyqrcodejs_1 = __importDefault(require("easyqrcodejs"));
class QRCodeGenerator {
    static generateQRCode(appData, size = 256) {
        const qrData = this.serializeAppType(appData);
        const options = {
            text: qrData,
            width: size,
            height: size,
        };
        const element = document.createElement('div');
        new easyqrcodejs_1.default(element, options);
        return element;
    }
    static serializeAppType(appType) {
        return JSON.stringify(appType);
    }
}
exports.QRCodeGenerator = QRCodeGenerator;
exports.default = QRCodeGenerator;
