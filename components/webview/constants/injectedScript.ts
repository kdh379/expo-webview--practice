export const INJECTED_JAVASCRIPT = `
  (function() {
    // 콘솔 로그 캡처
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };

    Object.keys(originalConsole).forEach(type => {
      console[type] = function(...args) {
        const message = args.map(item => {
          try {
            return typeof item === 'object' ? JSON.stringify(item) : String(item);
          } catch (e) {
            return String(item);
          }
        }).join(' ');
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CONSOLE',
          logType: type,
          message: message
        }));
        
        originalConsole[type].apply(console, args);
      };
    });

    true;
  })();
`; 