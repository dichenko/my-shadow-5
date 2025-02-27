import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* Метатеги и стили */}
        </Head>
        <body>
          <Main />
          <NextScript />
          <script dangerouslySetInnerHTML={{
            __html: `
              window.onerror = function(message, source, lineno, colno, error) {
                try {
                  fetch('/api/log-error', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      type: 'uncaught',
                      message: message,
                      source: source,
                      lineno: lineno,
                      colno: colno,
                      stack: error ? error.stack : null,
                      url: window.location.href,
                      userAgent: navigator.userAgent,
                      timestamp: new Date().toISOString()
                    }),
                  });
                } catch (e) {
                  console.error('Failed to send error log:', e);
                }
                
                // Отображаем ошибку на странице
                var errorDiv = document.createElement('div');
                errorDiv.style.position = 'fixed';
                errorDiv.style.top = '0';
                errorDiv.style.left = '0';
                errorDiv.style.right = '0';
                errorDiv.style.backgroundColor = '#ffebee';
                errorDiv.style.color = '#b71c1c';
                errorDiv.style.padding = '10px';
                errorDiv.style.zIndex = '9999';
                errorDiv.innerHTML = '<strong>Ошибка:</strong> ' + message + 
                  '<br><button onclick="window.location.reload()" style="margin-top:5px;padding:5px 10px;background:#b71c1c;color:white;border:none;border-radius:4px;">Перезагрузить</button>';
                document.body.appendChild(errorDiv);
                
                return true; // Предотвращаем стандартное поведение ошибки
              };
              
              window.addEventListener('unhandledrejection', function(event) {
                try {
                  fetch('/api/log-error', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      type: 'unhandledrejection',
                      reason: event.reason ? event.reason.toString() : 'Unknown Promise Rejection',
                      stack: event.reason && event.reason.stack ? event.reason.stack : null,
                      url: window.location.href,
                      userAgent: navigator.userAgent,
                      timestamp: new Date().toISOString()
                    }),
                  });
                } catch (e) {
                  console.error('Failed to send rejection log:', e);
                }
              });
            `
          }} />
        </body>
      </Html>
    );
  }
}

export default MyDocument; 