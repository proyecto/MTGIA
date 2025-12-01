import { useEffect, useState } from 'react';

export type Platform = 'desktop' | 'android' | 'ios' | 'web';

interface PlatformInfo {
    platform: Platform;
    isMobile: boolean;
    isDesktop: boolean;
    isTouchDevice: boolean;
}

/**
 * Hook to detect the current platform and provide platform-specific utilities
 */
export function usePlatform(): PlatformInfo {
    const [platformInfo, setPlatformInfo] = useState<PlatformInfo>(() =>
        detectPlatform()
    );

    useEffect(() => {
        // Re-detect on mount in case of SSR or initial detection issues
        setPlatformInfo(detectPlatform());
    }, []);

    return platformInfo;
}

/**
 * Detect the current platform
 */
function detectPlatform(): PlatformInfo {
    // Check if running in Tauri
    const isTauri = '__TAURI__' in window;

    if (isTauri) {
        // In Tauri, check the OS type
        const userAgent = navigator.userAgent.toLowerCase();

        if (userAgent.includes('android')) {
            return {
                platform: 'android',
                isMobile: true,
                isDesktop: false,
                isTouchDevice: true,
            };
        } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
            return {
                platform: 'ios',
                isMobile: true,
                isDesktop: false,
                isTouchDevice: true,
            };
        } else {
            return {
                platform: 'desktop',
                isMobile: false,
                isDesktop: true,
                isTouchDevice: hasTouchSupport(),
            };
        }
    }

    // Fallback for web browser
    return {
        platform: 'web',
        isMobile: isMobileDevice(),
        isDesktop: !isMobileDevice(),
        isTouchDevice: hasTouchSupport(),
    };
}

/**
 * Check if device has touch support
 */
function hasTouchSupport(): boolean {
    return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - legacy property
        navigator.msMaxTouchPoints > 0
    );
}

/**
 * Check if running on mobile device (based on screen size and user agent)
 */
function isMobileDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];

    const hasMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
    const hasSmallScreen = window.innerWidth <= 768;

    return hasMobileUserAgent || (hasSmallScreen && hasTouchSupport());
}

/**
 * Get safe area insets for devices with notches
 */
export function getSafeAreaInsets() {
    const style = getComputedStyle(document.documentElement);

    return {
        top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
    };
}
