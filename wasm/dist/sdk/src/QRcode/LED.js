"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const LED = ({ size = 10, connectionStatus = 'disconnected' }) => {
    const getColor = () => {
        switch (connectionStatus) {
            case 'web_connected':
                return '#424AD8';
            case 'mobile_connected':
                return '#31F040';
            default:
                return '#95a5a6';
        }
    };
    return (react_1.default.createElement("div", { style: {
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            backgroundColor: getColor(),
            boxShadow: `0 0 ${size * 1.5}px ${getColor()}`,
            transition: 'all 0.3s ease',
            marginBottom: '15px',
        } }));
};
exports.default = LED;
