import { registerSW } from 'virtual:pwa-register';

registerSW({
    immediate: false,
    onRegisterError(error) {
        console.error('SW registration failed:', error);
    }
});
