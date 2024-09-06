import React from 'react';
interface LEDProps {
    size?: number;
    connectionStatus?: 'disconnected' | 'web_connected' | 'mobile_connected';
}
declare const LED: React.FC<LEDProps>;
export default LED;
