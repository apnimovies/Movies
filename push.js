(function () {
  const config = window.MOVIEHUB_PUSH || {};
  const appId = String(config.appId || '').trim();
  const enableBtn = document.getElementById('notificationEnableBtn');
  const statusEl = document.getElementById('notificationStatus');

  function isConfigured() {
    return appId && appId !== 'PASTE_ONESIGNAL_APP_ID_HERE';
  }

  function setStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.className = `notification-status ${type || ''}`.trim();
  }

  function setButton(label, disabled) {
    if (!enableBtn) return;
    enableBtn.textContent = label;
    enableBtn.disabled = !!disabled;
  }

  if (!isConfigured()) {
    if (enableBtn) enableBtn.style.display = 'none';
    return;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal) {
    try {
      await OneSignal.init({
        appId,
        serviceWorkerPath: 'OneSignalSDKWorker.js',
        serviceWorkerParam: { scope: '/' },
        allowLocalhostAsSecureOrigin: true
      });

      const refreshUi = () => {
        const permission = OneSignal.Notifications.permission;
        const optedIn = OneSignal.User && OneSignal.User.PushSubscription
          ? OneSignal.User.PushSubscription.optedIn
          : false;

        if (permission && optedIn) {
          setButton('Notifications On', true);
          setStatus('New movie / web series alerts enabled.', 'success');
        } else if (Notification.permission === 'denied') {
          setButton('Notifications Blocked', true);
          setStatus('Browser settings me notifications allow karo.', 'error');
        } else {
          setButton('Enable Notifications', false);
          setStatus('New title add hote hi alert paane ke liye enable karo.', 'info');
        }
      };

      refreshUi();
      OneSignal.Notifications.addEventListener('permissionChange', refreshUi);
      if (OneSignal.User && OneSignal.User.PushSubscription) {
        OneSignal.User.PushSubscription.addEventListener('change', refreshUi);
      }

      if (enableBtn) {
        enableBtn.addEventListener('click', async () => {
          try {
            setButton('Enabling...', true);
            const accepted = await OneSignal.Notifications.requestPermission();
            if (accepted && OneSignal.User && OneSignal.User.PushSubscription) {
              await OneSignal.User.PushSubscription.optIn();
            }
            refreshUi();
          } catch (error) {
            console.error('Notification permission error:', error);
            setButton('Enable Notifications', false);
            setStatus('Notification enable nahi hua. Browser permission check karo.', 'error');
          }
        });
      }
    } catch (error) {
      console.error('OneSignal init error:', error);
      setStatus('Notification service load nahi hua.', 'error');
      setButton('Enable Notifications', true);
    }
  });
})();
