// Rolling in-memory log of Telegram chat events — last 200 entries.
const chatEvents = [];

export function logChatEvent(event) {
  chatEvents.push({ ts: new Date().toISOString(), ...event });
  if (chatEvents.length > 200) chatEvents.shift();
}

export function getChatEvents() {
  return chatEvents;
}
