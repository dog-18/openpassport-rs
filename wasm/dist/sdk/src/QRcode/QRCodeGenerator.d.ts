import { AppType } from '../../../common/src/utils/appType';
export declare class QRCodeGenerator {
    static generateQRCode(appData: AppType, size?: number): HTMLElement;
    private static serializeAppType;
}
export default QRCodeGenerator;
