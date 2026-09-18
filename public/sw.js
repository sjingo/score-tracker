self.addEventListener("push", (event) => {
  let data = {
    title: "Lions Score Tracker",
    body: "You have a new update.",
    url: "/",
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedUrl =
    typeof event.notification.data?.url === "string"
      ? event.notification.data.url
      : "/";
  const targetUrl = new URL(requestedUrl, self.location.origin);

  if (targetUrl.origin !== self.location.origin) {
    targetUrl.href = self.location.origin + "/";
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const targetClient = clientList.find(
          (client) => client.url === targetUrl.href,
        );

        if (targetClient) {
          return targetClient.focus();
        }

        const existingClient = clientList[0];
        if (existingClient && "navigate" in existingClient) {
          return existingClient.navigate(targetUrl.href).then((client) => {
            return (client || existingClient).focus();
          });
        }

        return self.clients.openWindow(targetUrl.href);
      }),
  );
});
