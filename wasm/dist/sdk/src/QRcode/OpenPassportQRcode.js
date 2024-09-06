"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const index_1 = require("../index");
const QRCodeGenerator_1 = require("./QRCodeGenerator");
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const react_spinners_1 = require("react-spinners");
const lottie_react_1 = __importDefault(require("lottie-react"));
const check_animation_json_1 = __importDefault(require("./animations/check_animation.json"));
const x_animation_json_1 = __importDefault(require("./animations/x_animation.json"));
const LED_1 = __importDefault(require("./LED"));
const ProofSteps = {
    WAITING_FOR_MOBILE: 'WAITING_FOR_MOBILE',
    MOBILE_CONNECTED: 'MOBILE_CONNECTED',
    PROOF_GENERATION_STARTED: 'PROOF_GENERATION_STARTED',
    PROOF_GENERATED: 'PROOF_GENERATED',
    PROOF_VERIFIED: 'PROOF_VERIFIED',
};
const OpenPassportQRcode = ({ appName, scope, userId, requirements, onSuccess, devMode = false, }) => {
    const [proofStep, setProofStep] = (0, react_1.useState)(ProofSteps.WAITING_FOR_MOBILE);
    const [proofVerified, setProofVerified] = (0, react_1.useState)(null);
    const [sessionId, setSessionId] = (0, react_1.useState)(crypto.randomUUID());
    const [showAnimation, setShowAnimation] = (0, react_1.useState)(false);
    const [connectionStatus, setConnectionStatus] = (0, react_1.useState)('disconnected');
    const [qrElement, setQrElement] = (0, react_1.useState)(null);
    const [animationKey, setAnimationKey] = (0, react_1.useState)(0);
    const qrcodeRef = (0, react_1.useRef)(null);
    const lottieRef = (0, react_1.useRef)(null);
    const handleAnimationComplete = () => {
        console.log('Animation completed');
        setShowAnimation(false);
        setProofStep(ProofSteps.WAITING_FOR_MOBILE);
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);
    };
    (0, react_1.useEffect)(() => {
        const generateQR = async () => {
            const showCaseApp = {
                name: appName,
                scope,
                userId,
                sessionId,
                circuit: 'prove',
                arguments: {
                    disclosureOptions: Object.fromEntries(requirements),
                },
            };
            const qr = await QRCodeGenerator_1.QRCodeGenerator.generateQRCode(showCaseApp);
            setQrElement(qr);
        };
        generateQR();
    }, [appName, scope, userId, sessionId, requirements]);
    (0, react_1.useEffect)(() => {
        const newSocket = (0, socket_io_client_1.default)('https://proofofpassport-merkle-tree.xyz', {
            path: '/websocket',
            query: { sessionId, clientType: 'web' },
        });
        const handleMobileStatus = async (data) => {
            console.log('Received mobile status:', data.status);
            switch (data.status) {
                case 'mobile_connected':
                    setConnectionStatus('mobile_connected');
                    setProofStep(ProofSteps.MOBILE_CONNECTED);
                    break;
                case 'mobile_disconnected':
                    setConnectionStatus('web_connected');
                    break;
                case 'proof_generation_started':
                    setProofStep(ProofSteps.PROOF_GENERATION_STARTED);
                    break;
                case 'proof_generated':
                    setProofStep(ProofSteps.PROOF_GENERATED);
                    break;
            }
            if (data.proof) {
                const openPassport1StepVerifier = new index_1.OpenPassport1StepVerifier({
                    scope,
                    requirements,
                    dev_mode: devMode,
                });
                try {
                    const local_proofVerified = await openPassport1StepVerifier.verify(data.proof);
                    setProofVerified({ valid: local_proofVerified.valid });
                    setProofStep(ProofSteps.PROOF_VERIFIED);
                    newSocket.emit('proof_verified', {
                        sessionId,
                        proofVerified: local_proofVerified.toString(),
                    });
                    if (local_proofVerified.valid && onSuccess) {
                        onSuccess(local_proofVerified);
                    }
                }
                catch (error) {
                    console.error('Error verifying proof:', error);
                    setProofVerified({ valid: false, error: error.message });
                    newSocket.emit('proof_verified', {
                        sessionId,
                        proofVerified: { valid: false, error: error.message },
                    });
                }
            }
        };
        newSocket.on('connect', () => setConnectionStatus('web_connected'));
        newSocket.on('disconnect', () => {
            setConnectionStatus('disconnected');
            setProofStep(ProofSteps.WAITING_FOR_MOBILE);
        });
        newSocket.on('mobile_status', handleMobileStatus);
        return () => {
            newSocket.disconnect();
        };
    }, [sessionId, scope, requirements, devMode, onSuccess]);
    (0, react_1.useEffect)(() => {
        if (qrElement && qrcodeRef.current) {
            qrcodeRef.current.innerHTML = '';
            qrcodeRef.current.appendChild(qrElement);
        }
    }, [qrElement]);
    (0, react_1.useEffect)(() => {
        if (proofStep === ProofSteps.PROOF_VERIFIED && proofVerified?.valid === true) {
            setShowAnimation(true);
            setAnimationKey((prev) => prev + 1);
        }
    }, [proofStep, proofVerified]);
    const renderProofStatus = () => (react_1.default.createElement("div", { className: "flex flex-col items-center" },
        react_1.default.createElement(LED_1.default, { connectionStatus: connectionStatus }),
        react_1.default.createElement("div", { className: "w-[300px] h-[300px] flex items-center justify-center" }, (() => {
            switch (proofStep) {
                case ProofSteps.WAITING_FOR_MOBILE:
                case ProofSteps.MOBILE_CONNECTED:
                    return qrElement ? react_1.default.createElement("div", { ref: qrcodeRef }) : null;
                case ProofSteps.PROOF_GENERATION_STARTED:
                case ProofSteps.PROOF_GENERATED:
                    return react_1.default.createElement(react_spinners_1.BounceLoader, { loading: true, size: 200, color: "#94FBAB" });
                case ProofSteps.PROOF_VERIFIED:
                    if (proofVerified?.valid === true) {
                        return showAnimation ? (react_1.default.createElement(lottie_react_1.default, { key: animationKey, lottieRef: lottieRef, animationData: check_animation_json_1.default, style: { width: 200, height: 200 }, loop: false, autoplay: true, onComplete: handleAnimationComplete })) : qrElement ? (react_1.default.createElement("div", { ref: qrcodeRef })) : null;
                    }
                    else {
                        return (react_1.default.createElement(lottie_react_1.default, { key: animationKey, lottieRef: lottieRef, animationData: x_animation_json_1.default, style: { width: 200, height: 200 }, loop: false, autoplay: true, onComplete: handleAnimationComplete }));
                    }
                default:
                    return null;
            }
        })())));
    return renderProofStatus();
};
exports.default = OpenPassportQRcode;
