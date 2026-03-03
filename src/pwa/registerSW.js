import { registerSW } from 'virtual:pwa-register';

registerSW({
    immediate: true,
    onRegisterError(error) {
        console.error('SW registration failed:', error);
    }
});

